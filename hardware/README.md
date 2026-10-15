# PulseCity AI — Hardware & Edge Telemetry Blueprint

> **Autonomous Urban Nervous System for Emerging Megacities**  
> *Target Validation: Greater Accra Metropolitan Area (GAMA), Ghana*

---

## 1. System Architecture Overview

PulseCity AI is designed for resilient, low-cost edge sensing in environments subject to rolling power outages (*Dumsor*) and variable cellular connectivity.

```mermaid
graph TD
    subgraph Edge Sentry Nodes (Under $20)
        A[ESP32-WROOM-32D] -->|ADC Analog| B[MQ-135 Air Quality Sensor]
        A -->|GPIO Trigger/Echo| C[HC-SR04 Waterproof Ultrasonic Sluice Sensor]
        D[Raspberry Pi Zero 2 W] -->|CSI Camera Ribbon| E[Pi Cam v2 / Low-Light USB]
        F[5V 10W Solar Panel + 18650 LiFePO4] -->|Uninterruptible Power| A
        F -->|Uninterruptible Power| D
    end

    subgraph Dual-Link Communication
        A -->|TLS 1.3 / HTTPS POST| G[Vercel Serverless Gateway: /api/v1/telemetry/ingest]
        D -->|LTE Cat-1 / LoRaWAN Fallback| G
        D -->|Offline Disconnect| H[(Local SQLite Persistent Buffer)]
    end

    subgraph Municipal Cloud Brain
        G --> I[Webster Adaptive Signal Engine]
        G --> J[Priority Knapsack Grid Balancer]
        G --> K[Odaw River Hydrological Alert Engine]
        I --> L[Field Officer HUD / Operations Dashboard]
        J --> L
        K --> L
    end
```

---

## 2. Ultra-Low-Cost Bill of Materials (BOM)

To win municipal procurement in developing markets, sensor unit cost must remain **under $20 USD** per node.

| Component | Function | Model / Spec | Est. Unit Cost (USD) |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | Central processing & TLS uplink | ESP32-WROOM-32D (Dual-Core 240MHz, Wi-Fi/BLE) | **$3.20** |
| **Edge Vision Processor** | Video vehicle contour counting | Raspberry Pi Zero 2 W (Quad-Core 64-bit 1GHz) | **$15.00** *(Optional for video nodes)* |
| **Environmental Sensor** | NO2, CO, PM2.5 indirect gas detection | MQ-135 Gas Sensor Module | **$1.45** |
| **Hydrological Sensor** | Odaw River flood elevation sensing | HC-SR04 / JSN-SR04T Waterproof Ultrasonic | **$2.80** |
| **Power Buffer** | 36-hr Dumsor power backup | 18650 3.7V 2600mAh LiFePO4 + TP4056 BMS | **$2.10** |
| **Enclosure** | IP66 Weatherproof junction box | ABS Plastic NEMA-4 Outdoor Enclosure | **$3.50** |
| **Total Node Cost** | **Complete Environmental / Hydrological Node** | | **$13.05 USD** |

---

## 3. Hardware Pinout & Wiring Specification

### A. ESP32 Environmental & Flood Sentry (`esp32_firmware.ino`)
- **VCC**: Connect to 5V (regulated output from solar BMS)
- **GND**: Common Ground
- **MQ-135 Gas Sensor**:
  - `VCC` -> `5V`
  - `GND` -> `GND`
  - `AOUT` -> `GPIO 36` (ADC1_CHANNEL_0)
- **HC-SR04 / JSN-SR04T Ultrasonic Flood Sensor**:
  - `VCC` -> `5V`
  - `GND` -> `GND`
  - `TRIG` -> `GPIO 5`
  - `ECHO` -> `GPIO 18` (via 1kΩ / 2kΩ voltage divider to step 5V echo to 3.3V safe logic)
- **Status Diagnostic LED**:
  - Internal or External LED on `GPIO 2`

### B. Raspberry Pi Zero 2 W Edge Vision Sentinel (`raspberry_pi_camera_edge.py`)
- **Camera**: Connect 5MP OmniVision OV5647 via 15-pin CSI ribbon cable to Pi Zero camera port.
- **Power**: Micro-USB 5V/2.5A from Solar Battery Management System.
- **Software Dependencies**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y python3-opencv python3-requests sqlite3
  ```

---

## 4. Flashing & Deployment Instructions

### Method 1: Flash ESP32 via Arduino CLI
```bash
# 1. Install ESP32 core
arduino-cli core update-index
arduino-cli core install esp32:esp32

# 2. Compile firmware
arduino-cli compile --fqbn esp32:esp32:esp32 hardware/esp32_firmware.ino

# 3. Flash to connected serial port (e.g. /dev/ttyUSB0 on Linux /dev/cu.usbserial on macOS)
arduino-cli upload -p /dev/ttyUSB0 --fqbn esp32:esp32:esp32 hardware/esp32_firmware.ino
```

### Method 2: Launch Raspberry Pi Edge Vision Service
```bash
# 1. Clone repository on Pi
git clone https://github.com/fedorov17808-svg/pulsecity-ai.git
cd pulsecity-ai/hardware

# 2. Set environment variables
export PULSECITY_GATEWAY="https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest"
export PULSECITY_SENSOR_TOKEN="<your token>"
export NODE_ID="TR-01"

# 3. Run daemon service
python3 raspberry_pi_camera_edge.py --node-id TR-01 --interval 5
```

---

## 5. Security & Authentication Guardrails

1. **Bearer Token Handshake**: Every packet requires header `X-Sensor-Token: $PULSECITY_SENSOR_TOKEN`. Packets without this token are dropped with HTTP 401.
2. **Schema Sanitization**: Node IDs are validated against strict regex: `^(TR|EN|ECO)-\d{2}$`.
3. **Replay & Out-of-Bounds Protection**: Values outside physical ranges (e.g., negative queue lengths, river levels above 10m, or frequency outside 45-55 Hz) trigger automatic gateway validation errors.
4. **TLS 1.3 Encryption**: All edge-to-cloud packets traverse HTTPS over TLS 1.3, ensuring traffic cannot be spoofed on unencrypted public Wi-Fi or cellular towers.
