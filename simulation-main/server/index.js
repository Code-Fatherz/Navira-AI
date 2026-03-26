// ============================================================
// Mediroute AI - Backend Server
// Express + WebSocket for real-time emergency management
// ============================================================

const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { Simulation } = require('./simulation');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// --- Initialize Simulation ---
const sim = new Simulation();
// Pre-fetch real road geometries from OSRM
sim.initRoads().catch(console.error);

// Broadcast simulation updates to all connected WebSocket clients
sim.onUpdate((type, data) => {
  const message = JSON.stringify({ type, data });
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
});

// --- REST API ---

// Get current system state
app.get('/api/status', (req, res) => {
  res.json(sim.getState());
});

// Get traffic signals
app.get('/api/signals', (req, res) => {
  res.json({ signals: sim.getState().signals });
});

// Get performance metrics
app.get('/api/metrics', (req, res) => {
  res.json(sim.getMetrics());
});

// Create emergency (async - fetches real routes from OSRM)
app.post('/api/emergency', async (req, res) => {
  try {
    const result = await sim.startEmergency();
    if (!result) {
      return res.status(400).json({ error: 'Emergency already active or route fetch failed' });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Emergency creation error:', err);
    res.status(500).json({ error: 'Failed to create emergency' });
  }
});

// Reset simulation
app.post('/api/reset', (req, res) => {
  const state = sim.reset();
  res.json({ success: true, ...state });
});

// --- WebSocket ---
wss.on('connection', (ws) => {
  console.log('🔌 Client connected');
  ws.send(JSON.stringify({ type: 'init', data: sim.getState() }));
  ws.on('close', () => {
    console.log('🔌 Client disconnected');
  });
});

// --- Simulation Loop (300ms tick for smooth ambulance animation) ---
setInterval(() => {
  sim.tick();
}, 300);

// --- Start Server ---
const PORT = 4000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🚑 Mediroute AI Server Running       ║
  ║   Port: ${PORT}                             ║
  ║   API:  http://localhost:${PORT}/api        ║
  ║   WS:   ws://localhost:${PORT}              ║
  ╚══════════════════════════════════════════╝
  `);
});
