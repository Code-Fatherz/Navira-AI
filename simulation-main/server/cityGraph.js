const https = require('https');

class CityGraph {
  constructor() {
    this.nodes = {}; // { id: { lat, lon, connected_roads: [] } }
    this.edges = []; // { id, nodes: [] }
    this.intersections = [];
    this.roadSegments = [];
  }

  async buildGraph() {
    return new Promise((resolve, reject) => {
      console.log('[CityGraph] Fetching OpenStreetMap roads for Chandigarh...');
      const query = `
        [out:json][timeout:25];
        (
          way["highway"~"primary|secondary"](30.69,76.73,30.77,76.83);
        );
        out body;
        >;
        out skel qt;
      `;
      const options = {
        hostname: 'overpass-api.de',
        path: '/api/interpreter',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            this.parseOSM(json.elements);
            resolve({ intersections: this.intersections, roadSegments: this.roadSegments });
          } catch (e) {
            console.error('[CityGraph] OSM Parse Error:', e);
            console.log('[CityGraph] Falling back to backup map data...');
            this.buildFallbackGraph();
            resolve({ intersections: this.intersections, roadSegments: this.roadSegments });
          }
        });
      });
      req.on('error', (err) => {
        console.error('[CityGraph] Network Error:', err);
        console.log('[CityGraph] Falling back to backup map data...');
        this.buildFallbackGraph();
        resolve({ intersections: this.intersections, roadSegments: this.roadSegments });
      });
      req.write('data=' + encodeURIComponent(query));
      req.end();
    });
  }

  parseOSM(elements) {
    const tempNodes = {};
    const graph = {};

    elements.forEach(el => {
      if (el.type === 'node') {
        tempNodes[el.id] = { id: el.id, lat: el.lat, lon: el.lon };
        graph[el.id] = new Set();
      }
    });

    elements.forEach(el => {
      if (el.type === 'way' && el.nodes) {
        this.edges.push({ id: el.id, nodes: el.nodes });
        
        let coords = [];
        for (let idx of el.nodes) {
          if (tempNodes[idx]) coords.push({ lat: tempNodes[idx].lat, lng: tempNodes[idx].lon });
        }
        if (coords.length > 1) {
          this.roadSegments.push({ id: `way-${el.id}`, coords, name: el.tags?.name || 'Road' });
        }
        for (let i = 0; i < el.nodes.length; i++) {
          const u = el.nodes[i];
          if (!graph[u]) graph[u] = new Set();
          if (i > 0) {
            const v = el.nodes[i - 1];
            graph[u].add(v);
            if (!graph[v]) graph[v] = new Set();
            graph[v].add(u);
          }
          if (i < el.nodes.length - 1) {
            const v = el.nodes[i + 1];
            graph[u].add(v);
            if (!graph[v]) graph[v] = new Set();
            graph[v].add(u);
          }
        }
      }
    });

    let sigId = 1;
    for (const [nodeId, neighbors] of Object.entries(graph)) {
      if (neighbors.size >= 3) {
        const node = tempNodes[nodeId];
        if (node) {
          // Calculate bearings for connected roads to classify NS vs EW
          const roads = Array.from(neighbors).map(nId => {
            const neighbor = tempNodes[nId];
            return {
              id: nId,
              bearing: this.calculateBearing(node, neighbor)
            };
          });

          this.intersections.push({
            intersection_id: `SIG-${sigId++}`,
            latitude: node.lat,
            longitude: node.lon,
            connected_roads: neighbors.size,
            roads: roads, // Needed by SignalController to group NS/EW
            traffic_density: Math.floor(Math.random() * 70) + 10,
            current_phase: 1,
            signal_state: 'RED', // Will be managed by controller
            green_duration: 30
          });
        }
      }
    }
    console.log(`[CityGraph] Graph built. Detected ${this.intersections.length} valid >=3 way intersections.`);
  }

  calculateBearing(startNode, endNode) {
    const lat1 = startNode.lat * Math.PI / 180;
    const lon1 = startNode.lon * Math.PI / 180;
    const lat2 = endNode.lat * Math.PI / 180;
    const lon2 = endNode.lon * Math.PI / 180;

    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // 0 to 360
  }

  buildFallbackGraph() {
    const MAJOR_ROADS_FALLBACK = [
      { id: 'FR1', points: [[30.7626, 76.7766], [30.7483, 76.7905], [30.7380, 76.8020], [30.7258, 76.8055], [30.7100, 76.8210]], name: 'Madhya Marg' },
      { id: 'FR2', points: [[30.7100, 76.7400], [30.7150, 76.7500], [30.7315, 76.7620], [30.7188, 76.7958], [30.7050, 76.8100]], name: 'Dakshin Marg' },
      { id: 'FR3', points: [[30.7600, 76.7950], [30.7483, 76.7905], [30.7380, 76.7820], [30.7315, 76.7620], [30.7200, 76.7500]], name: 'Jan Marg' },
      { id: 'FR4', points: [[30.7450, 76.7750], [30.7380, 76.7820], [30.7320, 76.7840], [30.7258, 76.8055]], name: 'Udyog Path' },
      { id: 'FR5', points: [[30.7550, 76.8000], [30.7320, 76.7840], [30.7200, 76.7750], [30.7100, 76.7650]], name: 'Himalaya Marg' },
      { id: 'FR6', points: [[30.7258, 76.8055], [30.7188, 76.7958], [30.7050, 76.7850]], name: 'Purv Marg' },
      { id: 'FR7', points: [[30.7150, 76.7500], [30.7050, 76.7650], [30.6950, 76.7800], [30.7188, 76.7958]], name: 'Vikas Marg' },
      { id: 'FR8', points: [[30.7600, 76.7500], [30.7400, 76.7500], [30.7200, 76.7500]], name: 'V Vidya Path' }
    ];

    this.roadSegments = [];
    this.intersections = [];
    let sigId = 1;

    MAJOR_ROADS_FALLBACK.forEach(road => {
      for (let i = 0; i < road.points.length - 1; i++) {
        const start = { lat: road.points[i][0], lng: road.points[i][1] };
        const end = { lat: road.points[i+1][0], lng: road.points[i+1][1] };
        
        this.roadSegments.push({
          id: `${road.id}-${i}`,
          name: road.name,
          start: start,
          end: end,
          coords: [start, end],
          vehicles: Math.floor(Math.random() * 40) + 10
        });

        // Add intersections at points
        if (i > 0 && i < road.points.length - 1) {
          const pt = road.points[i];
          this.intersections.push({
            intersection_id: `SIG-F${sigId++}`,
            latitude: pt[0],
            longitude: pt[1],
            connected_roads: 4,
            roads: [
              { id: 1, bearing: 0 },
              { id: 2, bearing: 90 },
              { id: 3, bearing: 180 },
              { id: 4, bearing: 270 }
            ],
            traffic_density: Math.floor(Math.random() * 70) + 10,
            current_phase: 1,
            signal_state: 'RED',
            green_duration: 30
          });
        }
      }
    });

    const uniqueInts = [];
    const seenMap = new Set();
    this.intersections.forEach(i => {
      const key = `${i.latitude.toFixed(4)},${i.longitude.toFixed(4)}`;
      if (!seenMap.has(key)) {
        seenMap.add(key);
        uniqueInts.push(i);
      }
    });
    this.intersections = uniqueInts;
    console.log(`[CityGraph] Fallback graph generated with ${this.intersections.length} intersections and ${this.roadSegments.length} road segments.`);
  }
}

module.exports = new CityGraph();
