// Mock Telemetry and Geospatial Nodes for PulseCity AI (Accra Megacity Context)

export const CITY_METRICS = {
  cityName: "Greater Accra Metropolitan Area",
  country: "Ghana",
  population: "4.2M",
  activeSensors: 1420,
  aiUptime: "99.98%",
  avgCommuteSavingsMin: 18.5,
  blackoutsAverted7d: 19,
  co2ReductionTons: 340.2,
};

export const TRAFFIC_NODES = [
  {
    id: "TR-01",
    name: "Kwame Nkrumah Interchange (Circle)",
    type: "interchange",
    x: 46, // % coordinates on map
    y: 52,
    congestion: 78, // %
    speedKmh: 14,
    flowRate: 3420, // vehicles / hr
    lightState: "RED", // GREEN, YELLOW, RED
    cycleRemainingSec: 14,
    cameraFeed: "CAM-01: Circle Flyover 360",
    alert: "Heavy congestion approaching northbound slip road",
    incidentActive: false,
    ambulancePriority: false,
  },
  {
    id: "TR-02",
    name: "Tema Motorway Toll Corridor",
    type: "highway",
    x: 78,
    y: 38,
    congestion: 91,
    speedKmh: 8,
    flowRate: 4890,
    lightState: "GREEN",
    cycleRemainingSec: 28,
    cameraFeed: "CAM-02: Motorway East Gate",
    alert: "Severe bottleneck: Broken down haulage truck lane 2",
    incidentActive: true,
    incidentType: "Vehicle Breakdown & Road Blockage",
    ambulancePriority: false,
  },
  {
    id: "TR-03",
    name: "Spintex Road Retail Strip",
    type: "arterial",
    x: 65,
    y: 48,
    congestion: 64,
    speedKmh: 22,
    flowRate: 2150,
    lightState: "GREEN",
    cycleRemainingSec: 35,
    cameraFeed: "CAM-03: Spintex Junction 4",
    alert: "Moderate evening peak flow",
    incidentActive: false,
    ambulancePriority: false,
  },
  {
    id: "TR-04",
    name: "Kaneshie First Light Junction",
    type: "junction",
    x: 34,
    y: 58,
    congestion: 52,
    speedKmh: 28,
    flowRate: 1980,
    lightState: "RED",
    cycleRemainingSec: 8,
    cameraFeed: "CAM-04: Kaneshie Market Overpass",
    alert: "Market bus queue extending onto outer lane",
    incidentActive: false,
    ambulancePriority: false,
  },
  {
    id: "TR-05",
    name: "Liberation Road (Airport Bypass)",
    type: "arterial",
    x: 58,
    y: 32,
    congestion: 35,
    speedKmh: 48,
    flowRate: 1650,
    lightState: "GREEN",
    cycleRemainingSec: 42,
    cameraFeed: "CAM-05: Airport City Gateway",
    alert: "Optimal transit corridor",
    incidentActive: false,
    ambulancePriority: false,
  },
  {
    id: "TR-06",
    name: "Independence Avenue / Ministries",
    type: "government_hub",
    x: 48,
    y: 68,
    congestion: 42,
    speedKmh: 36,
    flowRate: 1400,
    lightState: "GREEN",
    cycleRemainingSec: 20,
    cameraFeed: "CAM-06: High Court Junction",
    alert: "Smooth VIP corridor flow",
    incidentActive: false,
    ambulancePriority: false,
  }
];

export const ENERGY_NODES = [
  {
    id: "EN-01",
    name: "Achimota Bulk Supply Point (BSP)",
    type: "substation",
    x: 42,
    y: 35,
    capacityMw: 250,
    currentLoadMw: 232, // 92.8% - critical
    status: "STRAINED", // NOMINAL, STRAINED, CRITICAL
    dumsorRisk: 86, // % risk of load shedding
    solarInputMw: 18,
    batteryReservePct: 45,
    connectedDistricts: ["Achimota", "Dome", "Taifa", "West Legon"],
  },
  {
    id: "EN-02",
    name: "Mallam Grid Substation",
    type: "substation",
    x: 28,
    y: 62,
    capacityMw: 180,
    currentLoadMw: 124,
    status: "NOMINAL",
    dumsorRisk: 22,
    solarInputMw: 8,
    batteryReservePct: 78,
    connectedDistricts: ["Mallam", "Gbawe", "Weija", "Kasoa North"],
  },
  {
    id: "EN-03",
    name: "Accra Central Commercial Substation",
    type: "substation",
    x: 50,
    y: 60,
    capacityMw: 220,
    currentLoadMw: 188,
    status: "STRAINED",
    dumsorRisk: 68,
    solarInputMw: 14,
    batteryReservePct: 62,
    connectedDistricts: ["Ministries", "Makola", "Ridge Hospital", "Osu"],
  },
  {
    id: "EN-04",
    name: "Legon Solar Microgrid Park",
    type: "solar_farm",
    x: 60,
    y: 22,
    capacityMw: 65,
    currentLoadMw: 58,
    status: "NOMINAL",
    dumsorRisk: 4,
    solarInputMw: 58,
    batteryReservePct: 92,
    connectedDistricts: ["Univ of Ghana", "Legon Campus", "Haatso"],
  },
  {
    id: "EN-05",
    name: "Tema Free Zone Industrial Microgrid",
    type: "battery_hub",
    x: 82,
    y: 44,
    capacityMw: 150,
    currentLoadMw: 132,
    status: "NOMINAL",
    dumsorRisk: 34,
    solarInputMw: 32,
    batteryReservePct: 88,
    connectedDistricts: ["Tema Harbor", "Industrial Free Zone", "Kpone"],
  }
];

export const ECO_NODES = [
  {
    id: "ECO-01",
    name: "Agbogbloshie Environmental Station",
    type: "industrial_zone",
    x: 44,
    y: 56,
    aqi: 168, // Unhealthy
    pm25: 84.5, // ug/m3
    no2: 48.2, // ppb
    wasteLevelPct: 84,
    status: "CRITICAL",
    recommendation: "Deploy air scrubber drone + AMA waste evacuation truck",
  },
  {
    id: "ECO-02",
    name: "Korle Lagoon Water & Odor Monitor",
    type: "lagoon_wetland",
    x: 40,
    y: 66,
    aqi: 112,
    pm25: 42.1,
    no2: 26.5,
    wasteLevelPct: 76,
    status: "WARNING",
    recommendation: "Canal dredging silt barrier activation required",
  },
  {
    id: "ECO-03",
    name: "Makola Central Market Waste Hub",
    type: "market_hub",
    x: 48,
    y: 62,
    aqi: 94,
    pm25: 33.8,
    no2: 31.0,
    wasteLevelPct: 92,
    status: "CRITICAL",
    recommendation: "Compactor truck #08 dispatched. Estimated arrival: 14 mins",
  },
  {
    id: "ECO-04",
    name: "Airport Residential Green Zone",
    type: "green_canopy",
    x: 55,
    y: 35,
    aqi: 38,
    pm25: 9.2,
    no2: 12.1,
    wasteLevelPct: 15,
    status: "GOOD",
    recommendation: "Canopy microclimate baseline stable",
  },
  {
    id: "ECO-05",
    name: "Jamestown Coastal CleanAir Sensor",
    type: "coastal_station",
    x: 45,
    y: 74,
    aqi: 54,
    pm25: 14.6,
    no2: 15.4,
    wasteLevelPct: 45,
    status: "MODERATE",
    recommendation: "Sea breeze dispersion effective",
  }
];

export const PRESET_CRISES = [
  {
    id: "crisis-motorway-pileup",
    title: "🚨 Major Pileup on Tema Motorway Eastbound",
    track: "Traffic Mitigation",
    description: "3-vehicle collision blocking two lanes. Traffic backed up 4.2km. Ambulance en route from 37 Military Hospital.",
    targetNodeId: "TR-02",
    actions: [
      "AI reroutes 60% of incoming traffic to Spintex Alternate Arterial",
      "Dynamic green-wave priority granted to Ambulance Unit AMB-04",
      "Digital Variable Message Signs updated along Tetteh Quarshie Interchange"
    ]
  },
  {
    id: "crisis-achimota-dumsor",
    title: "⚡ Imminent Blackout (Dumsor) Surge at Achimota BSP",
    track: "Electricity Efficiency",
    description: "Transformer T-3 temperature reached 88°C, load spiked to 96.4%. Grid collapse imminent without fast load shedding.",
    targetNodeId: "EN-01",
    actions: [
      "AI draws 35 MW from Legon Solar Microgrid batteries in 80ms",
      "Diverts 15 MW commercial neon billboards & non-essential public cooling",
      "Preserves residential circuits in Dome and Taifa, preventing 48,000 homes from darkness"
    ]
  },
  {
    id: "crisis-makola-waste-flood",
    title: "🍃 Flash Storm & Waste Canal Choke at Circle / Makola",
    track: "Pollution Control",
    description: "Heavy rain causing floating plastic waste to choke drain grates at Odaw river basin, rapid flooding threat.",
    targetNodeId: "ECO-03",
    actions: [
      "Emergency sluice gates automated opening triggered",
      "AMA Rapid Waste Response Unit dispatched with real-time GPS clear path",
      "Citizen SMS broadcast issued for flood avoidance in Circle basin"
    ]
  }
];
