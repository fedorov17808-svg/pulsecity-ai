/**
 * Road Network Topology Graph & Dijkstra / A* Routing Algorithm
 * for Greater Accra Emergency Green-Wave Corridor
 */

export const ACCRA_ROAD_GRAPH = {
  nodes: {
    "N-CIRCLE": { id: "N-CIRCLE", name: "Kwame Nkrumah Interchange", lat: 5.5560, lng: -0.1969 },
    "N-KANESHIE": { id: "N-KANESHIE", name: "Kaneshie First Light", lat: 5.5680, lng: -0.2350 },
    "N-RIDGE": { id: "N-RIDGE", name: "Ridge Hospital Roundabout", lat: 5.5620, lng: -0.1920 },
    "N-AIRPORT": { id: "N-AIRPORT", name: "Airport Bypass Junction", lat: 5.6050, lng: -0.1780 },
    "N-37MIL": { id: "N-37MIL", name: "37 Military Hospital Intersect", lat: 5.5890, lng: -0.1830 },
    "N-SPINTEX": { id: "N-SPINTEX", name: "Spintex Junction", lat: 5.6280, lng: -0.1050 },
    "N-MOTORWAY": { id: "N-MOTORWAY", name: "Tema Motorway Toll", lat: 5.6540, lng: -0.0160 },
    "N-MINISTRIES": { id: "N-MINISTRIES", name: "Independence Ave / Ministries", lat: 5.5480, lng: -0.1980 }
  },
  edges: [
    { from: "N-KANESHIE", to: "N-CIRCLE", distanceKm: 4.2, baseSpeedKmh: 45 },
    { from: "N-CIRCLE", to: "N-RIDGE", distanceKm: 1.8, baseSpeedKmh: 40 },
    { from: "N-RIDGE", to: "N-37MIL", distanceKm: 3.4, baseSpeedKmh: 50 },
    { from: "N-37MIL", to: "N-AIRPORT", distanceKm: 2.1, baseSpeedKmh: 55 },
    { from: "N-AIRPORT", to: "N-SPINTEX", distanceKm: 8.5, baseSpeedKmh: 60 },
    { from: "N-SPINTEX", to: "N-MOTORWAY", distanceKm: 11.2, baseSpeedKmh: 75 },
    { from: "N-CIRCLE", to: "N-MINISTRIES", distanceKm: 2.5, baseSpeedKmh: 40 },
    { from: "N-MINISTRIES", to: "N-RIDGE", distanceKm: 2.0, baseSpeedKmh: 35 },
    { from: "N-37MIL", to: "N-SPINTEX", distanceKm: 9.8, baseSpeedKmh: 50 }
  ]
};

/**
 * Dijkstra / A* Routing Algorithm with Live Congestion Penalties
 */
export function findOptimalEmergencyRoute(startNodeId, targetNodeId, roadConditions = {}) {
  const { nodes, edges } = ACCRA_ROAD_GRAPH;

  // Strict input validation to prevent crash
  if (!startNodeId || !nodes[startNodeId]) {
    return { success: false, error: `Invalid start node ID '${startNodeId}'` };
  }
  if (!targetNodeId || !nodes[targetNodeId]) {
    return { success: false, error: `Invalid target node ID '${targetNodeId}'` };
  }

  // Build Adjacency List with dynamic weights
  const adj = {};
  Object.keys(nodes).forEach((n) => { adj[n] = []; });

  edges.forEach((edge) => {
    const edgeKey = `${edge.from}_${edge.to}`;
    const reverseKey = `${edge.to}_${edge.from}`;
    const isBlocked = roadConditions[edgeKey]?.isBlocked || roadConditions[reverseKey]?.isBlocked;
    const congestionFactor = roadConditions[edgeKey]?.congestion || roadConditions[reverseKey]?.congestion || 40;

    // Weight is travel time in minutes: (distance / speed) * 60 * congestion_penalty
    const effectiveSpeed = Math.max(8, edge.baseSpeedKmh * (1 - congestionFactor / 120));
    const travelTimeMin = isBlocked ? 999 : (edge.distanceKm / effectiveSpeed) * 60;

    if (adj[edge.from]) adj[edge.from].push({ node: edge.to, weight: travelTimeMin, distance: edge.distanceKm, isBlocked });
    if (adj[edge.to]) adj[edge.to].push({ node: edge.from, weight: travelTimeMin, distance: edge.distanceKm, isBlocked });
  });

  // Priority Queue / Dijkstra
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(nodes));

  Object.keys(nodes).forEach((n) => {
    distances[n] = Infinity;
    previous[n] = null;
  });
  distances[startNodeId] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let smallestDist = Infinity;
    unvisited.forEach((n) => {
      if (distances[n] < smallestDist) {
        smallestDist = distances[n];
        current = n;
      }
    });

    if (current === null || distances[current] === Infinity) break;
    if (current === targetNodeId) break;

    unvisited.delete(current);

    (adj[current] || []).forEach((neighbor) => {
      if (unvisited.has(neighbor.node)) {
        const alt = distances[current] + neighbor.weight;
        if (alt < distances[neighbor.node]) {
          distances[neighbor.node] = alt;
          previous[neighbor.node] = current;
        }
      }
    });
  }

  // Reconstruct path
  const path = [];
  let curr = targetNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  if (path[0] !== startNodeId || distances[targetNodeId] === Infinity || distances[targetNodeId] === undefined) {
    return { success: false, error: "No viable path found due to severe blockage." };
  }

  // Coordinates array for Leaflet Polyline
  const gpsPath = path.map((nodeId) => [nodes[nodeId].lat, nodes[nodeId].lng]);
  const estimatedTimeNormalMin = Number((distances[targetNodeId] || 15).toFixed(1));
  const estimatedTimeGreenWaveMin = Number(((distances[targetNodeId] || 15) * 0.38).toFixed(1)); // 62% reduction via priority signal sync

  return {
    success: true,
    startNode: nodes[startNodeId].name,
    targetNode: nodes[targetNodeId].name,
    pathNodeIds: path,
    pathNodeNames: path.map((id) => nodes[id].name),
    gpsPath,
    estimatedTimeNormalMin,
    estimatedTimeGreenWaveMin,
    timeSavedMinutes: Number((estimatedTimeNormalMin - estimatedTimeGreenWaveMin).toFixed(1)),
    intersectionsToGreenLock: path
  };
}
