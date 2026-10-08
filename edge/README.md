# PulseNode-01: Field Implementation Guide & Hardware Architecture
**Target Deployment:** Kwame Nkrumah Circle Interchange (Slip-Road & Ring Road West), Greater Accra, Ghana  
**Standards Compliance:** NEMA TS-2 Type 1 • MUTCD Section 4D • IEC 60947 Solid-State Relays

---

## 1. The Core Engineering Problem
In emerging megacities across West Africa, formal traffic light timings fail because informal mass transit (**Trotros** in Accra, **Danfos** in Lagos) does not behave like private passenger cars.
Trotros stop directly inside roundabout slip roads to pick up and discharge passengers. When the passenger loading bay fills to capacity ($>80\%$), incoming Trotros spill back onto the roundabout. Fixed or standard green-time controllers continue dispensing green signals, causing an unrecoverable **circular gridlock (Deadlock Shockwave)**.

**PulseNode-01** solves this with **Lighthill-Whitham-Richards (LWR) Spillback Gating**:
1. Optical camera computes real-time **Bay Occupancy Ratio** ($O_{bay}$).
2. When $O_{bay} \ge 0.80$, the edge controller gates (holds red) on the incoming arterial, preventing more vehicles from entering the clogged ring road, while extending green for the egress clearance movement.
3. Once $O_{bay} < 0.60$, the controller reverts to adaptive Webster phase allocation.

---

## 2. Hardware Bill of Materials (BOM) — Total: $342.50 USD

All components are standard industrial DIN-rail or COTS (Commercial Off-The-Shelf) hardware:

| Item | Component | Manufacturer & Part Number | Function | Unit Cost (USD) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Single Board Edge Compute** | Raspberry Pi CM4 (4GB RAM, 32GB eMMC) or Orange Pi 5 | Local AI Inference & Controller Loop | $65.00 |
| **2** | **Neural AI Accelerator** | Raspberry Pi AI Kit (Hailo-8L, 13 TOPS) or Google Coral M.2 | 30 FPS YOLOv8 INT8 vehicle detection | $70.00 |
| **3** | **Solid-State Relays (x4)** | Fotek SSR-40DA (Optoisolated 40A 240VAC) | Switching 240V signal heads without contact bounce | $24.00 ($6 x 4) |
| **4** | **Safety Watchdog Timer** | Phoenix Contact Safety Relay (PSR-SCP-24UC) | Hardware CMU watchdog (trips if heartbeat halts >400ms) | $48.50 |
| **5** | **DIN-Rail Power Supply** | Mean Well HDR-60-12 (12V 4.5A Ultra-Slim) | 240VAC to 12VDC cabinet power conversion | $18.00 |
| **6** | **LiFePO4 Solar/UPS Buffer** | Eco-Worthy 12V 12Ah LiFePO4 battery pack | 6-hour continuous power backup during Dumsor blackouts | $42.00 |
| **7** | **Optical Sensor Enclosure** | Hikvision DS-2CD2047G2-L 4MP IP67 Outdoor Bullet Camera | 1080p 30 FPS day/night RTSP optical stream | $75.00 |
| **TOTAL** | | | | **$342.50** |

---

## 3. Physical Cabinet Interlock Architecture (0 Wire Cut Retrofit)

PulseNode does **NOT** replace the municipal controller cabinet; it interfaces in parallel through the standard **NEMA TS-2 Preemption Terminal Strip**:

```
[ IP67 Camera ] ──(PoE Ethernet)──► [ PulseNode CM4 + Hailo-8L ]
                                                │
                                    (500ms Watchdog Heartbeat)
                                                ▼
                                   [ Phoenix Safety Relay ]
                                                │ (OK)
                                                ▼
       [ 4x Optoisolated Relays ] ──────────────┴──────► [ NEMA TS-2 Cabinet Terminal Block ]
              (Phase 1/2 SSR)                               (Pins 101-108: Preempt 1-4)
                                                                        │
                                                            [ Conflict Monitor Unit CMU-16LE ]
                                                                        │
                                                         (Guarantees NO conflicting greens)
                                                                        ▼
                                                             [ Traffic Signal Heads ]
```

### Safety Interlock Guarantee:
1. **CMU-16LE Dominance:** The legacy Conflict Monitor Unit (CMU) has absolute hardware priority over PulseNode. If PulseNode ever attempts to energize two conflicting green heads simultaneously, the CMU instantly drops the controller to **Fail-Safe Flashing Yellow** in $<20$ milliseconds.
2. **Watchdog Failsafe:** PulseNode must toggle GPIO Pin 18 every 500ms. If the Linux OS crashes, kernel panics, or camera cable disconnects, the watchdog drops and returns the intersection to standard fixed-timer operation.

---

## 4. How to Run Locally

### Prerequisites
- Python 3.9+
- Linux, macOS, or Raspberry Pi OS

### Execution
```bash
# 1. Clone repository & navigate to edge folder
cd edge

# 2. Run standalone controller simulation
python3 pulse_node.py
```

### Example Telemetry Output:
```json
{
  "timestamp_epoch": 1791471134.07,
  "current_phase": "PHASE_2_TROTRO_CLEAR",
  "bay_occupancy_ratio": 0.88,
  "spillback_gating_active": true,
  "shockwave_velocity_kmh": -117.51,
  "approach_pcu": 66.8,
  "optimal_green_sec": 12,
  "cmu_heartbeat_ok": true,
  "hardware_relays": {
    "PHASE_1_GREEN": false,
    "PHASE_1_YELLOW": false,
    "PHASE_1_RED": true,
    "PHASE_2_GREEN": true,
    "PHASE_2_YELLOW": false,
    "PHASE_2_RED": false,
    "CMU_HEARTBEAT": true
  }
}
```
