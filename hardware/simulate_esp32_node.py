#!/usr/bin/env python3
"""
PulseCity AI — Hardware Field Node Simulator CLI
Streams realistic physical sensor packets from the terminal into the PulseCity Ingestion Gateway.
Allows technical judges and engineers to test live HTTP POST ingestion without physical breadboards.

Usage:
  python3 hardware/simulate_esp32_node.py --node ECO-01 --once
  python3 hardware/simulate_esp32_node.py --node TR-01 --interval 3
  python3 hardware/simulate_esp32_node.py --node EN-01 --gateway http://localhost:5173/api/v1/telemetry/ingest
"""

import sys
import time
import json
import random
import argparse
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

DEFAULT_GATEWAY = "http://localhost:5173/api/v1/telemetry/ingest"
DEFAULT_TOKEN = "afri-pulse-live-2026"

def generate_telemetry_payload(node_id: str) -> dict:
    now_ms = int(time.time() * 1000)
    
    if node_id.startswith("ECO"):
        # ESP32 Environmental & Flood Gauge
        dist_cm = random.uniform(8.0, 95.0)
        water_level = round(4.50 - (dist_cm / 100.0), 2)
        aqi = random.randint(35, 185)
        waste_fill = min(100, max(5, int((100 - dist_cm) * 1.05)))
        drain_choke = water_level > 3.20 or dist_cm < 18.0
        
        return {
            "nodeId": node_id,
            "type": "ENVIRONMENTAL_ECO",
            "aqiScore": aqi,
            "waterLevelMeters": water_level,
            "wasteFillPercentage": waste_fill,
            "drainageChokeDetected": drain_choke,
            "temperatureCelsius": round(random.uniform(27.0, 32.5), 1),
            "humidityPercentage": round(random.uniform(70.0, 88.0), 1),
            "firmwareVersion": "v3.0.0-esp32-prod",
            "hardwareBench": "ESP32-S3 + JSN-SR04T + MQ135",
            "timestamp": now_ms
        }
    
    elif node_id.startswith("TR"):
        # Raspberry Pi / Edge Camera Sentinel
        hour = time.localtime().tm_hour
        is_peak = (7 <= hour <= 9) or (16 <= hour <= 19)
        base_vehicles = 42 if is_peak else 22
        vehicles = max(6, int(base_vehicles + random.gauss(0, 5)))
        flow_vph = vehicles * 115
        congestion_pct = min(98, max(15, int((vehicles / 45.0) * 100)))
        incident = congestion_pct > 80 and random.random() < 0.35
        
        return {
            "nodeId": node_id,
            "type": "TRAFFIC_MOBILITY",
            "queueLength": vehicles,
            "flowRateVehiclesPerHour": flow_vph,
            "congestionPercentage": congestion_pct,
            "avgSpeedKmh": max(8.0, round(52.0 - (vehicles * 0.9), 1)),
            "incidentDetected": incident,
            "incidentDetails": "Trotro breakdown blocking approach lane" if incident else "Normal urban transit progression",
            "emergencyTransitActive": False,
            "edgeModel": "YOLOv8n-INT8 / RPi Zero 2W",
            "timestamp": now_ms
        }
    
    else:
        # Achimota / Mallam Grid Substation SCADA
        base_load = 228.0
        load_mw = round(base_load + random.uniform(-8.0, 16.0), 1)
        strained = load_mw > 230.0
        dumsor_risk = min(99, max(20, int((load_mw / 250.0) * 100)))
        
        return {
            "nodeId": node_id,
            "type": "ELECTRICITY_GRID",
            "currentLoadMw": load_mw,
            "dumsorRiskScore": dumsor_risk,
            "solarInputMw": round(random.uniform(12.0, 24.0), 1),
            "gridFrequencyHz": round(50.0 + random.uniform(-0.15, 0.08), 2),
            "reactivePowerMvar": round(load_mw * 0.42, 1),
            "powerFactorCosPhi": 0.88,
            "protocol": "IEC_60870_5_104",
            "timestamp": now_ms
        }

def send_packet(gateway_url: str, token: str, payload: dict) -> bool:
    data = json.dumps(payload).encode('utf-8')
    req = Request(gateway_url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("X-Sensor-Token", token)
    req.add_header("User-Agent", "PulseCity-Hardware-Bench-Simulator/3.0")

    start_t = time.time()
    try:
        with urlopen(req, timeout=4.0) as resp:
            latency_ms = int((time.time() - start_t) * 1000)
            res_body = resp.read().decode('utf-8')
            print(f"[{time.strftime('%H:%M:%S')}] ✓ 201 CREATED | Node: {payload['nodeId']} | Latency: {latency_ms}ms")
            return True
    except HTTPError as e:
        print(f"[{time.strftime('%H:%M:%S')}] ✗ HTTP Error {e.code}: {e.read().decode('utf-8')}")
        return False
    except URLError as e:
        print(f"[{time.strftime('%H:%M:%S')}] ✗ Connection Failed to {gateway_url}: {e.reason}")
        print("  Hint: Is your Vite dev server running on port 5173? Run 'npm run dev' first.")
        return False

def main():
    parser = argparse.ArgumentParser(description="PulseCity AI Hardware Field Node Simulator")
    parser.add_argument("--node", default="ECO-01", help="Node ID (e.g. ECO-01, TR-01, EN-01)")
    parser.add_argument("--gateway", default=DEFAULT_GATEWAY, help="Cloud or local ingestion URL")
    parser.add_argument("--token", default=DEFAULT_TOKEN, help="X-Sensor-Token header")
    parser.add_argument("--interval", type=float, default=5.0, help="Transmit interval in seconds")
    parser.add_argument("--once", action="store_true", help="Send a single packet and exit")
    args = parser.parse_args()

    print("=================================================================")
    print("  PulseCity AI — Hardware Field Node Simulator (IEEE Bench)")
    print(f"  Target: {args.node} | Endpoint: {args.gateway}")
    print("=================================================================")

    if args.once:
        pkt = generate_telemetry_payload(args.node)
        print("Payload:", json.dumps(pkt, indent=2))
        send_packet(args.gateway, args.token, pkt)
        sys.exit(0)

    try:
        count = 1
        while True:
            pkt = generate_telemetry_payload(args.node)
            print(f"Packet #{count} ->", end=" ")
            send_packet(args.gateway, args.token, pkt)
            count += 1
            time.sleep(args.interval)
    except KeyboardInterrupt:
        print("\nSimulator stopped by user.")

if __name__ == "__main__":
    main()
