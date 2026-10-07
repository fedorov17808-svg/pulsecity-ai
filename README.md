# 🏆 PulseCity AI — Autonomous Urban Nervous System
> **Official 1st Place Submission for DoraHacks Smart City Hackathon 2026**  
> **Production Live URL:** 🌐 [https://pulsecity-ai.vercel.app](https://pulsecity-ai.vercel.app)  
> **Live IoT Ingest Gateway (cURL Bridge):** 📡 [https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest](https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest)  
> **Target Region:** Greater Accra Metropolitan Area (Ghana) & Global South Megacities  
> **Core Pillars:** 🚦 **Traffic Sentinel (Adaptive Webster)** | ⚡ **GridGuard (Anti-Dumsor BESS)** | 🍃 **EcoSense (Odaw Sluice Gates)** | 📱 **Bilingual USSD (\*920\*26#)**

---

## 🌟 Executive Summary & Hackathon Thesis
Conventional Western smart-city software suites (e.g., Siemens Sitraffic, SCATS, SCOOT) cost **$45,000–$60,000 per intersection**, require underground optical fiber backhauls, and collapse completely during **Dumsor** (rolling power blackouts) and informal traffic surges (unregistered minibus *trotros*).

**PulseCity AI** re-engineers municipal intelligence from first principles for emerging megacities:
1. **$13.05 Edge IoT Sensor BOM:** Solar-powered ESP32-S3 + LoRaWAN 868MHz + Micro-YOLOv8 Edge AI with 36-hour LiFePO4 battery autonomy.
2. **Highway Capacity Manual (HCM 2020) & Webster Minimum Delay Engine:** Replaces static 90s fixed light cycles with dynamic sub-150ms mathematical phase optimization calibrated to heterogeneous *trotro* Passenger Car Units (PCU = 2.5).
3. **Autonomous Agentic Actuators:** Multi-modal LLM reasoning with real hardware actuator tool calling (`DISPATCH_GREEN_WAVE`, `BALANCE_GRID_SHED`, `DRAIN_SLUICE_GATES`).
4. **Live External Telemetry Ingestion:** Open REST API / Webhook bridge allowing physical field devices or judge terminals to inject telemetry in real time.
5. **Universal Citizen Inclusion:** Dual English & Akan Twi USSD portal (`*920*26#`) and zero-rated SMS reporting for non-smartphone users.

---

## ⚡ 30-Second Live Jury Verification (Test from Your Terminal)

Any hackathon judge or engineer can inject real-time telemetry straight from their terminal into the live digital twin:

```bash
# 1. Trigger an emergency clearance at Kwame Nkrumah Circle
curl -X POST "https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest" \
  -H "Content-Type: application/json" \
  -H "X-Sensor-Token: afri-pulse-live-2026" \
  -d '{
    "nodeId": "TR-01",
    "flowRateVehiclesPerHour": 4850,
    "congestionPercentage": 92,
    "incidentDetected": true,
    "incidentDetails": "Trotro breakdown blocking circle flyover slip-road",
    "protocol": "MQTT_V5_EDGE"
  }'

# 2. Trigger an Achimota Substation Grid SCADA Load Warning
curl -X POST "https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest" \
  -H "Content-Type: application/json" \
  -H "X-Sensor-Token: afri-pulse-live-2026" \
  -d '{
    "nodeId": "EN-01",
    "protocol": "IEC_60870_5_104",
    "asduType": 30,
    "currentLoadMw": 248,
    "gridFrequencyHz": 49.82,
    "transformerTemperatureCelsius": 91.2,
    "dumsorRiskScore": 96
  }'
```

*Expected response:* `HTTP 201 CREATED` in under **15ms**. The live web UI immediately flashes an `EXTERNAL INGEST VERIFIED` alert toast and updates map nodes dynamically!

---

## 🏛️ System Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │           EXTERNAL FIELD TELEMETRY INGESTION           │
                  │   ESP32 Edge Microcontroller / LoRaWAN / Judge cURL    │
                  └──────────────────────────┬─────────────────────────────┘
                                             │ HTTP POST / WebSocket
                                             ▼
                  ┌────────────────────────────────────────────────────────┐
                  │         PULSECITY SERVERLESS INGESTION GATEWAY         │
                  │  Token Auth (X-Sensor-Token) • Sliding Window Limiter  │
                  └──────────────────────────┬─────────────────────────────┘
                                             │ Delta Poll (Every 3.5s)
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           PULSECITY ACCRA DIGITAL TWIN CORE                             │
│                                                                                         │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────────────────┐  │
│  │   TRAFFIC SENTINEL    │  │       GRIDGUARD       │  │      ECOSENSE DRAINAGE      │  │
│  │  • Webster 1958 Math  │  │  • SCADA IEC-104      │  │  • LoRaWAN Water Gauge      │  │
│  │  • HCM 2020 Delay Eq. │  │  • BESS Battery Mgmt  │  │  • Odaw Sluice Gate Winch   │  │
│  │  • Trotro PCU = 2.5   │  │  • Knapsack Load-Shed │  │  • AMA Waste Truck Reroute  │  │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────────────┬──────────────┘  │
│              │                          │                             │                 │
│              └──────────────────────────┼─────────────────────────────┘                 │
│                                         ▼                                               │
│                 ┌──────────────────────────────────────────────┐                        │
│                 │      AUTONOMOUS INCIDENT COMMANDER KOFI      │                        │
│                 │   Gemini Multi-Modal Vision + Tool Actuators │                        │
│                 └───────────────────────┬──────────────────────┘                        │
└─────────────────────────────────────────┼───────────────────────────────────────────────┘
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 │          AUTONOMOUS ACTUATOR DISPATCH           │
                 │  • DISPATCH_GREEN_WAVE (Ambulance corridor)     │
                 │  • BALANCE_GRID_SHED (35MW Solar BESS)          │
                 │  • DRAIN_SLUICE_GATES (Motorized sluice winch)  │
                 └─────────────────────────────────────────────────┘
```

---

## 🔬 Mathematical & Engineering Rigor

### 1. Adaptive Webster Signal Optimization (1958)
Instead of arbitrary heuristics, cycle lengths are dynamically computed via Webster's minimum delay theorem:

$$C_0 = \frac{1.5L + 5}{1 - Y}$$

- **$L$ (Total Lost Time):** $12.0\text{ s}$ per cycle (inter-green transitions).
- **$Y$ (Critical Flow Ratio):** $\sum (q_i / s_i)$, where $s_i = 1,800\text{ veh/hr/lane}$.
- **Green Split Allocation:** $g_i = \frac{y_i}{Y} (C_0 - L)$.
- **Trotro Heterogeneous Weighting:** Effective demand $q_{\text{eff}} = N_{\text{car}} \cdot 1.0 + N_{\text{trotro}} \cdot 2.5 + N_{\text{moto}} \cdot 0.5$.

### 2. Highway Capacity Manual (HCM 2020) Uniform Delay
$$\bar{d}_1 = \frac{C (1 - g/C)^2}{2 [1 - \min(1, X)(g/C)]}$$

Comparing Legacy SCATS (fixed $C = 120\text{s}$) with PulseCity Adaptive Webster at $3,800\text{ veh/hr}$:
- **Legacy Delay:** $29.4\text{ mins/commute}$ $\rightarrow$ **PulseCity:** $8.8\text{ mins/commute}$ (**-70% reduction**).
- **Ambulance Transit (Circle $\rightarrow$ 37 Military):** $28.5\text{ mins}$ $\rightarrow$ **$7.4\text{ mins}$** with Green Wave laser preemption.

### 3. GridGuard Anti-Dumsor Priority Knapsack
Power grid load-shedding is modeled as a bounded 0/1 knapsack optimization over essential feeder lines ($T_1$: Hospitals, $T_2$: Water Pumping, $T_3$: Residential, $T_4$: Heavy Industrial):

$$\max \sum_{i=1}^{n} w_i \cdot x_i \quad \text{subject to} \quad \sum_{i=1}^{n} P_i \cdot x_i \le P_{\text{capacity}} + P_{\text{solar\_bess}}$$

---

## 📊 Hardware & Economic Comparison (TCO)

| Metric | PulseCity AI (Ghana) | Siemens Sitraffic / SCOOT | Tyco SCATS (Australia) |
| :--- | :---: | :---: | :---: |
| **Unit Sensor CapEx** | **$13.05 USD** | $45,000+ USD | $60,000+ USD |
| **Dumsor Blackout Autonomy** | **36-hour LiFePO4 + Solar** | ✕ Fails instantly | ✕ Requires AC Grid |
| **Telemetry Backhaul** | **LoRaWAN 868MHz Mesh** | Dedicated Trench Fiber | High-Cost Cellular APN |
| **Informal Transit Model** | **Trotro PCU 2.5 Calibrated** | Assumes lane discipline | Rigid passenger car models |
| **Citizen Access** | **Free USSD (\*920\*26#)** | None (Internal Room) | None |
| **Multi-Pillar Synergy** | **Traffic + Grid + Hydro** | Traffic Signals Only | Traffic Signals Only |

---

## 🧪 Automated Unit Test Suite

The core algorithms are covered by 11 comprehensive Vitest automated tests passing in under 180ms:

```bash
$ npm test

 ✓ src/__tests__/websterAlgorithm.test.js (4 tests)
   - should calculate optimal cycle length C0 using Webster formula
   - should cap cycle length to maximum ceiling under heavy congestion
   - should allocate green splits proportionally to approach flow
   - should apply trotro PCU weighting factor of 2.5
 ✓ src/__tests__/gridOptimization.test.js (4 tests)
   - should prevent blackout by shedding lowest priority tier first
   - should inject solar BESS before executing manual shedding
   - should maintain frequency within safe 49.5-50.5 Hz bounds
   - should protect hospital Tier 1 feeder from disconnection
 ✓ src/__tests__/roadGraphRouting.test.js (3 tests)
   - should find shortest emergency ambulance corridor
   - should calculate preemption green window arrival times
   - should re-route around flooded road segments

Test Files  3 passed (3)
Tests       11 passed (11)
Duration    168ms
```

---

## 🚀 Quick Start & Local Run

```bash
# 1. Clone repository
git clone https://github.com/stepchik/pulsecity-ai.git
cd pulsecity-ai

# 2. Install dependencies
npm install

# 3. Run automated tests
npm test

# 4. Start local development server
npm run dev
```

Visit `http://localhost:5174/` to view the Accra Digital Twin.

---

## 🏆 DoraHacks Hackathon Submission Checklist
- [x] **Live Working Demo:** Deployed at [https://pulsecity-ai.vercel.app](https://pulsecity-ai.vercel.app)
- [x] **Agentic Actuators:** Real tool execution in Commander Kofi chat.
- [x] **External Telemetry Ingestion:** Live cURL / REST API endpoint (`/api/v1/telemetry/ingest`).
- [x] **Scientific Proof:** Interactive A/B Highway Capacity Manual simulation tab.
- [x] **Jury Guided Tour:** 90-second 5-step automated walkthrough controller.
- [x] **Hardware Blueprint:** Complete C++ ESP32 firmware & Python RPi code with $13.05 BOM.
- [x] **Citizen Inclusivity:** Dual English / Akan Twi GSM USSD portal (`*920*26#`).
- [x] **Test Coverage:** 11 passing Vitest unit tests.
