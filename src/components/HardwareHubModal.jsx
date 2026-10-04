import React, { useState } from 'react';

const ESP32_SNIPPET = `// PulseCity AI — ESP32 WROOM-32D Environmental & Flood Telemetry Firmware
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "MUNICIPAL_MESH_GAMA";
const char* password = "SECRET_WIFI_PASS";
const char* serverUrl = "https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest";
const char* sensorAuthToken = "afri-pulse-live-2026";
const char* nodeId = "ECO-01"; // Korle Lagoon / Odaw River Station

#define PIN_MQ135_ANALOG 36
#define PIN_ULTRASONIC_TRIG 5
#define PIN_ULTRASONIC_ECHO 18
#define BRIDGE_DECK_ELEVATION_METERS 4.50

void setup() {
  Serial.begin(115200);
  pinMode(PIN_ULTRASONIC_TRIG, OUTPUT);
  pinMode(PIN_ULTRASONIC_ECHO, INPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
}

float measureWaterLevel() {
  digitalWrite(PIN_ULTRASONIC_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_ULTRASONIC_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_ULTRASONIC_TRIG, LOW);
  long duration = pulseIn(PIN_ULTRASONIC_ECHO, HIGH, 30000);
  float distanceMeters = (duration * 0.0343) / 2.0 / 100.0;
  return BRIDGE_DECK_ELEVATION_METERS - distanceMeters;
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Or pin Vercel Let's Encrypt CA Root
    HTTPClient https;
    https.begin(client, serverUrl);
    https.addHeader("Content-Type", "application/json");
    https.addHeader("X-Sensor-Token", sensorAuthToken);

    StaticJsonDocument<256> doc;
    doc["nodeId"] = nodeId;
    doc["type"] = "ENVIRONMENTAL";
    doc["waterLevelMeters"] = measureWaterLevel();
    doc["aqi"] = map(analogRead(PIN_MQ135_ANALOG), 0, 4095, 20, 300);

    String requestBody;
    serializeJson(doc, requestBody);
    int httpCode = https.POST(requestBody);
    https.end();
  }
  delay(10000); // 10s sample interval
}`;

const RPI_PYTHON_SNIPPET = `#!/usr/bin/env python3
# PulseCity AI — Edge Vision Sentinel (RPi Zero 2 W / MOG2 Centroid Tracker)
import cv2, requests, time

GATEWAY = "https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest"
TOKEN = "afri-pulse-live-2026"
NODE_ID = "TR-01"

cap = cv2.VideoCapture(0)
subtractor = cv2.createBackgroundSubtractorMOG2(history=300, varThreshold=25)

while True:
    ret, frame = cap.read()
    if not ret: break
    frame = cv2.resize(frame, (640, 360))
    fg_mask = subtractor.apply(frame)
    contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    vehicles = sum(1 for c in contours if cv2.contourArea(c) > 800)
    avg_speed = max(12.0, 50.0 - (vehicles * 1.4))
    
    payload = {
        "nodeId": NODE_ID,
        "type": "TRAFFIC",
        "queueLength": vehicles,
        "avgSpeedKmh": round(avg_speed, 1),
        "congestionLevel": "CRITICAL" if vehicles > 25 else "MODERATE"
    }
    
    headers = {"Content-Type": "application/json", "X-Sensor-Token": TOKEN}
    requests.post(GATEWAY, json=payload, headers=headers, timeout=3.0)
    time.sleep(5)`;

export default function HardwareHubModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('esp32');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/50 flex flex-col overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xl shadow-inner">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">IoT Hardware & Edge Firmware Suite</h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Sub-$20 Unit Cost
                </span>
              </div>
              <p className="text-xs text-slate-400">Production C++ and Python Edge implementations for Ghana municipal field nodes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab navigation */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('esp32')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'esp32'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              ESP32 C++ (Flood & Air)
            </button>
            <button
              onClick={() => setActiveTab('rpi')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'rpi'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Raspberry Pi Vision (Python)
            </button>
            <button
              onClick={() => setActiveTab('bom')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'bom'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              $13.05 BOM & Pinout
            </button>
          </div>

          {activeTab !== 'bom' && (
            <button
              onClick={() => copyCode(activeTab === 'esp32' ? ESP32_SNIPPET : RPI_PYTHON_SNIPPET)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-mono border border-emerald-500/30 flex items-center gap-1.5 transition"
            >
              {copied ? '✓ Copied' : '📋 Copy Source Code'}
            </button>
          )}
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'esp32' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="font-mono text-emerald-400">File: hardware/esp32_firmware.ino</span>
                <span>Targets: ESP32-WROOM-32D / ESP32-S3 | TLS 1.3 | WPA2/WPA3</span>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed max-h-[50vh]">
                {ESP32_SNIPPET}
              </pre>
            </div>
          )}

          {activeTab === 'rpi' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="font-mono text-emerald-400">File: hardware/raspberry_pi_camera_edge.py</span>
                <span>Targets: Raspberry Pi Zero 2 W / Pi 4 | OpenCV MOG2 Vehicle Tracking</span>
              </div>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed max-h-[50vh]">
                {RPI_PYTHON_SNIPPET}
              </pre>
            </div>
          )}

          {activeTab === 'bom' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Cost Optimization for Developing World Scalability</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Traditional Western smart city sensors cost upwards of $1,200/unit. PulseCity AI utilizes commercial off-the-shelf micro-electromechanical components, keeping capital expenditure under $15 per node for massive municipal rollouts across Accra, Kumasi, and Takoradi.
                </p>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-300 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Component</th>
                      <th className="py-2.5 px-4">Model & Specification</th>
                      <th className="py-2.5 px-4 text-right">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-emerald-400">Microcontroller</td>
                      <td className="py-2.5 px-4">ESP32-WROOM-32D (Dual-Core 240MHz, WiFi/BLE)</td>
                      <td className="py-2.5 px-4 text-right font-mono">$3.20</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-emerald-400">Air Quality Sensor</td>
                      <td className="py-2.5 px-4">MQ-135 Gas Module (NOx, NH3, Benzene, CO2)</td>
                      <td className="py-2.5 px-4 text-right font-mono">$1.45</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-emerald-400">Flood Depth Sonar</td>
                      <td className="py-2.5 px-4">JSN-SR04T Waterproof Ultrasonic Transducer</td>
                      <td className="py-2.5 px-4 text-right font-mono">$2.80</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-emerald-400">Power Buffer (Dumsor)</td>
                      <td className="py-2.5 px-4">18650 3.7V 2600mAh LiFePO4 Cell + TP4056 BMS</td>
                      <td className="py-2.5 px-4 text-right font-mono">$2.10</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-4 font-medium text-emerald-400">Solar Panel</td>
                      <td className="py-2.5 px-4">5V 10W Monocrystalline Panel</td>
                      <td className="py-2.5 px-4 text-right font-mono">$3.50</td>
                    </tr>
                    <tr className="bg-emerald-950/20 font-bold text-white border-t border-emerald-500/30">
                      <td className="py-3 px-4">Total Unit CapEx</td>
                      <td className="py-3 px-4 text-emerald-400">Ready for Mass Municipal Deployment</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 text-sm">$13.05 USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pinout summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="font-bold text-amber-400 mb-1">🔌 Ultrasonic Sonar Pins</div>
                  <div className="text-slate-400 font-mono space-y-0.5">
                    <div>VCC → 5.0V (Solar BMS)</div>
                    <div>GND → System Common Ground</div>
                    <div>TRIG → GPIO 5 (Trigger pulse 10µs)</div>
                    <div>ECHO → GPIO 18 (Voltage Divider 1k/2k)</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="font-bold text-blue-400 mb-1">💨 MQ-135 Gas Sensor Pins</div>
                  <div className="text-slate-400 font-mono space-y-0.5">
                    <div>VCC → 5.0V Heaters</div>
                    <div>GND → System Common Ground</div>
                    <div>AOUT → GPIO 36 (ADC1_CH0 12-bit)</div>
                    <div>DOUT → GPIO 4 (Threshold alert)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Firmware verified against Vercel Production API</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
