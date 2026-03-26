// ============================================================
// Mediroute AI - Simulation Engine v2.1
// Chandigarh City Map, 10 Ambulances, 8 Hospitals
// 4-way Traffic Lights at Actual Intersections
// Colored Road Segments reflecting traffic density
// Random Patient Position inside Chandigarh bounds
// ============================================================

const https = require('https');

// --- 10 Ambulances Scattered Around Chandigarh ---
const AMBULANCES = [
  { id: 'AMB-01', lat: 30.7415, lng: 76.7880, label: 'Ambulance 1 (Sector 17)', available: true },
  { id: 'AMB-02', lat: 30.7570, lng: 76.8047, label: 'Ambulance 2 (Capitol Complex)', available: true },
  { id: 'AMB-03', lat: 30.7107, lng: 76.7610, label: 'Ambulance 3 (ISBT-43)', available: true },
  { id: 'AMB-04', lat: 30.7600, lng: 76.7600, label: 'Ambulance 4 (PU Campus)', available: true },
  { id: 'AMB-05', lat: 30.7100, lng: 76.8000, label: 'Ambulance 5 (Industrial Area)', available: true },
  { id: 'AMB-06', lat: 30.6950, lng: 76.7400, label: 'Ambulance 6 (Mohali Border)', available: true },
  { id: 'AMB-07', lat: 30.7200, lng: 76.7550, label: 'Ambulance 7 (Sector 36)', available: true },
  { id: 'AMB-08', lat: 30.7650, lng: 76.8150, label: 'Ambulance 8 (Sukhna Lake)', available: true },
  { id: 'AMB-09', lat: 30.7000, lng: 76.7800, label: 'Ambulance 9 (Sector 47)', available: true },
  { id: 'AMB-10', lat: 30.7300, lng: 76.7700, label: 'Ambulance 10 (Sector 22)', available: true },
];


const CityGraph = require('./cityGraph');
const SignalController = require('./signalController');
const TrafficAI = require('./trafficAI');
const CorridorEngine = require('./corridorEngine');

// --- 8 Major Hospitals in Chandigarh Area ---
const HOSPITALS = [
  { id: 'HOS-01', lat: 30.7644, lng: 76.7747, label: 'PGIMER', beds: 1900 },
  { id: 'HOS-02', lat: 30.7250, lng: 76.7750, label: 'GMCH Sector 32', beds: 800 },
  { id: 'HOS-03', lat: 30.7431, lng: 76.7728, label: 'GMSH Sector 16', beds: 500 },
  { id: 'HOS-04', lat: 30.6923, lng: 76.7412, label: 'Fortis Hospital Mohali', beds: 350 },
  { id: 'HOS-05', lat: 30.7210, lng: 76.7610, label: 'Eden Hospital', beds: 120 },
  { id: 'HOS-06', lat: 30.7250, lng: 76.7710, label: 'Mukat Hospital', beds: 150 },
  { id: 'HOS-07', lat: 30.7400, lng: 76.8000, label: 'Landmark Hospital', beds: 100 },
  { id: 'HOS-08', lat: 30.7100, lng: 76.7650, label: 'Civil Hospital Sec 45', beds: 100 },
];

// --- Road Segments in Chandigarh (Colored Traffic Lines) ---
const MAJOR_ROADS = [
  { id: 'R1', points: [[30.7626, 76.7766], [30.7483, 76.7905], [30.7380, 76.8020], [30.7258, 76.8055], [30.7100, 76.8210]], name: 'Madhya Marg' },
  { id: 'R2', points: [[30.7100, 76.7400], [30.7150, 76.7500], [30.7315, 76.7620], [30.7188, 76.7958], [30.7050, 76.8100]], name: 'Dakshin Marg' },
  { id: 'R3', points: [[30.7600, 76.7950], [30.7483, 76.7905], [30.7380, 76.7820], [30.7315, 76.7620], [30.7200, 76.7500]], name: 'Jan Marg' },
  { id: 'R4', points: [[30.7450, 76.7750], [30.7380, 76.7820], [30.7320, 76.7840], [30.7258, 76.8055]], name: 'Udyog Path' },
  { id: 'R5', points: [[30.7550, 76.8000], [30.7320, 76.7840], [30.7200, 76.7750], [30.7100, 76.7650]], name: 'Himalaya Marg' },
  { id: 'R6', points: [[30.7258, 76.8055], [30.7188, 76.7958], [30.7050, 76.7850]], name: 'Purv Marg' },
  { id: 'R7', points: [[30.7150, 76.7500], [30.7050, 76.7650], [30.6950, 76.7800], [30.7188, 76.7958]], name: 'Vikas Marg' },
];

const ROAD_SEGMENTS = [];
MAJOR_ROADS.forEach(road => {
  for (let i = 0; i < road.points.length - 1; i++) {
    ROAD_SEGMENTS.push({
      id: `${road.id}-${i}`,
      name: road.name,
      start: { lat: road.points[i][0], lng: road.points[i][1] },
      end: { lat: road.points[i + 1][0], lng: road.points[i + 1][1] },
      coords: null, // Will be fetched via OSRM on init
      vehicles: 35,
    });
  }
});

// --- Fetch route from OSRM ---
function fetchRoute(start, end) {
  return new Promise((resolve, reject) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.routes && json.routes.length > 0) {
            const route = json.routes[0];
            const coords = route.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));
            resolve({ coords, duration: route.duration, distance: route.distance });
          } else {
            reject('No route found');
          }
        } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Interpolate points so ambulance moves smoothly
function interpolateRoute(coords, pointsPerSegment = 10) {
  const result = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const from = coords[i];
    const to = coords[i + 1];
    for (let j = 0; j < pointsPerSegment; j++) {
      const t = j / pointsPerSegment;
      result.push({ lat: from.lat + (to.lat - from.lat) * t, lng: from.lng + (to.lng - from.lng) * t });
    }
  }
  if (coords.length > 0) result.push(coords[coords.length - 1]);
  return result;
}

// Haversine distance (km)
function haversine(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Find signals near a route (within 400m)
function findSignalsNearRoute(signals, routeCoords, thresholdKm = 0.4) {
  const nearSignals = [];
  for (const sig of signals) {
    for (let i = 0; i < routeCoords.length; i += 5) {
      const dist = haversine(sig, routeCoords[i]);
      if (dist < thresholdKm) {
        nearSignals.push(sig.id);
        break;
      }
    }
  }
  return nearSignals;
}

// ============================================================
class Simulation {
  constructor() {
    this.signals = []; // Will be populated in initRoads
    this.roadSegments = []; // Will be populated by CityGraph
    this.ambulances = JSON.parse(JSON.stringify(AMBULANCES));
    this.hospitals = JSON.parse(JSON.stringify(HOSPITALS));
    this.patient = null;

    this.emergencyActive = false;
    this.phase = 'idle';
    this.activeAmbulanceId = null;
    this.activeHospitalId = null;
    this.ambulancePosition = null;
    this.routeIndex = 0;
    this.currentRoute = [];
    this.routeToPatientCoords = [];
    this.routeToHospitalCoords = [];
    this.greenCorridorSignals = [];
    this.startTime = null;
    this.routeToPatientDuration = 0;
    this.routeToHospitalDuration = 0;
    this.routeToPatientDistance = 0;
    this.routeToHospitalDistance = 0;
    this.animationSpeed = 2;
    this.listeners = [];

    // Normal traffic optimization metrics (shown even in idle state)
    this.normalTrafficStats = {
      avgWaitBefore: 45,
      avgWaitAfter: 32,
      signalsOptimized: 16,
      throughputIncrease: 29,
      totalVehiclesManaged: 0,
    };
  }

  onUpdate(cb) { this.listeners.push(cb); }
  broadcast(type, data) { this.listeners.forEach(cb => cb(type, data)); }

  // Async task to fetch real road coordinates
  async initRoads() {
    try {
      const graphData = await CityGraph.buildGraph();

      // Keep legacy support for haversine via root map
      this.signals = graphData.intersections.map(i => ({ ...i, lat: i.latitude, lng: i.longitude }));
      this.roadSegments = graphData.roadSegments;

      // Initialize Phase Controller and AI Optimization Loop
      SignalController.init(this.signals);
      SignalController.start(this.broadcast.bind(this));
      TrafficAI.start(this.signals, SignalController, this.broadcast.bind(this));

    } catch (e) {
      console.error('[Simulation] Failed to fetch OSM intersections via CityGraph:', e);
    }

    console.log('[Simulation] Real road geometries loaded.');
    this.broadcast('phase_change', this.getState());
  }

  applyTrafficPulse() {
    // Moved to trafficAI.js
  }

  cycleSignals() {
    // Moved to signalController.js

    // Fluctuate signal vehicles (intersections)
    this.signals.forEach(sig => {
      const delta = Math.floor(Math.random() * 5) - 2;
      sig.traffic_density = Math.max(5, Math.min(60, sig.traffic_density + delta));
    });

    // Fluctuate road segment vehicles (for full-road traffic density)
    this.roadSegments.forEach(road => {
      if (typeof road.vehicles === 'undefined') road.vehicles = Math.floor(Math.random() * 40) + 10;
      const delta = Math.floor(Math.random() * 5) - 2;
      road.vehicles = Math.max(5, Math.min(60, road.vehicles + delta));
    });
  }

  // --- Clear traffic ahead of ambulance ---
  clearTrafficAhead() {
    if (!this.ambulancePosition || !this.emergencyActive) return;

    // Delegate rolling green corridor to the corridor engine,
    // passing only the signal IDs that lie on the ambulance route.
    CorridorEngine.updateCorridor(
      this.ambulancePosition,
      this.currentRoute,
      this.routeIndex,
      this.signals,
      SignalController,
      this.greenCorridorSignals
    );
  }

  async startEmergency() {
    if (this.emergencyActive) return null;

    // Any random point inside Chandigarh bounds (30.70-30.77, 76.75-76.82)
    const plat = 30.700 + Math.random() * 0.070;
    const plng = 76.750 + Math.random() * 0.070;
    this.patient = { lat: plat, lng: plng, label: 'Random Chandigarh Location' };

    const availableAmbs = this.ambulances.filter(a => a.available);
    if (!availableAmbs.length) return null;

    try {
      this.routeToPatientCoords = [];
      this.routeToHospitalCoords = [];

      const ambOptions = await Promise.all(availableAmbs.map(async amb => {
        try { const r = await fetchRoute(amb, this.patient); return { ...amb, ...r }; }
        catch (e) { return null; }
      }));
      const validAmbs = ambOptions.filter(a => a !== null).sort((a, b) => a.duration - b.duration);
      if (validAmbs.length === 0) return null;

      const hospOptions = await Promise.all(this.hospitals.map(async h => {
        try { const r = await fetchRoute(this.patient, h); return { ...h, ...r }; }
        catch (e) { return null; }
      }));
      const validHosps = hospOptions.filter(h => h !== null).sort((a, b) => a.duration - b.duration);
      if (validHosps.length === 0) return null;

      const bestAmb = validAmbs[0];
      const nearestHosp = validHosps[0];

      this.routeToPatientCoords = interpolateRoute(bestAmb.coords, 8);
      this.routeToHospitalCoords = interpolateRoute(nearestHosp.coords, 8);
      this.routeToPatientDuration = bestAmb.duration;
      this.routeToPatientDistance = bestAmb.distance;
      this.routeToHospitalDuration = nearestHosp.duration;
      this.routeToHospitalDistance = nearestHosp.distance;

      this.emergencyActive = true;
      this.activeAmbulanceId = bestAmb.id;
      this.activeHospitalId = nearestHosp.id;
      this.phase = 'to_patient';

      this.currentRoute = this.routeToPatientCoords;
      this.routeIndex = 0;
      this.ambulancePosition = this.currentRoute[0];
      let ambRef = this.ambulances.find(a => a.id === bestAmb.id);
      if (ambRef) ambRef.available = false;

      this.startTime = Date.now();

      // Identify signals along the route (for corridor engine reference only)
      // Do NOT bulk-mark them as emergency — the corridor engine will activate
      // them progressively as the ambulance approaches each intersection.
      const allRouteCoords = [...this.routeToPatientCoords, ...this.routeToHospitalCoords];
      this.greenCorridorSignals = findSignalsNearRoute(this.signals, allRouteCoords, 0.4);

      this.broadcast('phase_change', Object.assign(this.getState(), { message: 'Emergency started!' }));

      return {
        routeToPatient: bestAmb.coords,
        routeToPatientDuration: bestAmb.duration,
        routeToHospital: nearestHosp.coords,
        routeToHospitalDuration: nearestHosp.duration,
        ambulanceOptions: validAmbs.map(a => ({ id: a.id, label: a.label, duration: a.duration, distance: a.distance, selected: a.id === bestAmb.id })),
        hospitalOptions: validHosps.map(h => ({ id: h.id, label: h.label, duration: h.duration, selected: h.id === nearestHosp.id })),
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  advanceAmbulance() {
    if (!this.ambulancePosition || this.routeIndex >= this.currentRoute.length - 1) {
      if (this.phase === 'to_patient') {
        this.phase = 'pickup';
        this.broadcast('phase_change', Object.assign(this.getState(), { message: 'Ambulance arrived at patient' }));
        setTimeout(() => {
          this.phase = 'to_hospital';
          this.currentRoute = this.routeToHospitalCoords;
          this.routeIndex = 0;
          this.ambulancePosition = this.currentRoute[0];
          this.startTime = Date.now();
          this.broadcast('phase_change', Object.assign(this.getState(), { message: 'En route to hospital' }));
        }, 1500);
      } else if (this.phase === 'to_hospital') {
        this.phase = 'arrived';
        this.emergencyActive = false;

        let ambRef = this.ambulances.find(a => a.id === this.activeAmbulanceId);
        if (ambRef && this.currentRoute.length > 0) {
          const last = this.currentRoute[this.currentRoute.length - 1];
          ambRef.lat = last.lat;
          ambRef.lng = last.lng;
          ambRef.available = true;
        }

        // Release any remaining overrides and reset corridor engine state
        this.signals.forEach(sig => {
          if (sig.onRoute === 'emergency') sig.onRoute = null;
          if (sig.override_phase) SignalController.releaseOverride(sig.intersection_id);
        });
        CorridorEngine.reset();

        const totalNormalTime = this.routeToPatientDuration + this.routeToHospitalDuration;
        const totalOptimizedTime = totalNormalTime * 0.55;

        this.broadcast('metrics_update', {
          normalTime: totalNormalTime,
          optimizedTime: totalOptimizedTime,
          timeSaved: totalNormalTime - totalOptimizedTime
        });

        this.broadcast('phase_change', Object.assign(this.getState(), { message: 'Patient delivered to hospital!' }));
      }
      return;
    }

    this.routeIndex += this.animationSpeed;
    if (this.routeIndex > this.currentRoute.length - 1) this.routeIndex = this.currentRoute.length - 1;
    this.ambulancePosition = this.currentRoute[Math.floor(this.routeIndex)];
  }

  getState() {
    let eta = null;
    let progress = 0;
    if (this.phase === 'to_patient') {
      const remainingSecs = Math.round(this.routeToPatientDuration * (1 - (this.routeIndex / this.routeToPatientCoords.length))) * 0.6;
      eta = { seconds: remainingSecs, display: `${Math.floor(remainingSecs / 60)}m ${remainingSecs % 60}s` };
      progress = Math.round((this.routeIndex / this.routeToPatientCoords.length) * 100);
    } else if (this.phase === 'to_hospital') {
      const remainingSecs = Math.round(this.routeToHospitalDuration * (1 - (this.routeIndex / this.routeToHospitalCoords.length))) * 0.6;
      eta = { seconds: remainingSecs, display: `${Math.floor(remainingSecs / 60)}m ${remainingSecs % 60}s` };
      progress = Math.round((this.routeIndex / this.routeToHospitalCoords.length) * 100);
    }

    return {
      signals: this.signals,
      roadSegments: this.roadSegments,
      intersections: [],
      ambulances: this.ambulances,
      hospitals: this.hospitals,
      ambulance: this.ambulancePosition,
      patient: this.patient,
      phase: this.phase,
      emergencyActive: this.emergencyActive,
      activeAmbulanceId: this.activeAmbulanceId,
      activeHospitalId: this.activeHospitalId,
      eta,
      routeProgress: progress,
      normalTrafficStats: this.normalTrafficStats,
    };
  }

  reset() {
    // Keep dynamically loaded signals/roads but reset emergency state
    this.signals.forEach(s => {
      s.override_phase = false;
      s.onRoute = null;
    });
    CorridorEngine.reset();

    this.emergencyActive = false;
    this.phase = 'idle';
    this.activeAmbulanceId = null;
    this.activeHospitalId = null;
    this.ambulancePosition = null;
    this.routeIndex = 0;
    this.currentRoute = [];
    this.routeToPatientCoords = [];
    this.routeToHospitalCoords = [];
    this.greenCorridorSignals = [];
    this.startTime = null;
    this.patient = null;

    // Ambulances stay at their newly updated positions if they finished an emergency! They just become available.
    this.ambulances.forEach(a => { a.available = true; });

    this.broadcast('phase_change', Object.assign(this.getState(), { message: 'System reset to idle' }));
  }

  tick() {
    this.cycleSignals();
    this.applyTrafficPulse();
    if (this.emergencyActive && this.phase !== 'arrived' && this.phase !== 'pickup') {
      this.clearTrafficAhead();
      this.advanceAmbulance();
    }
    this.broadcast('tick', this.getState());
  }
}

module.exports = { Simulation, AMBULANCES, HOSPITALS };
