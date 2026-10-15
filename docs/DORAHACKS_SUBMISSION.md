# DoraHacks Submission — PulseCity AI

## Project overview
- **Project name:** PulseCity AI
- **Hackathon:** Tech Hub Africa Hackathon 2026 (DoraHacks)
- **Track:** Traffic Mitigation (single track)
- **One-liner:** Camera-based vehicle counting in the browser feeds a Webster signal-timing
  calculation for Accra intersections, with an emergency "green wave" planner for ambulances.
- **Live app:** https://pulsecity-ai.vercel.app
- **Health endpoint:** https://pulsecity-ai.vercel.app/api/health
- **Repository:** https://github.com/fedorov17808-svg/pulsecity-ai
- **Demo video:** VIDEO_URL_HERE

## Problem
Most signalised junctions in Greater Accra run fixed-time plans. A fixed plan cannot react to the
actual mix of traffic at a junction — in particular the large share of trotro minibuses that load
and unload near intersections — so green time is wasted on empty approaches while queues build on
busy ones. Emergency vehicles have no priority mechanism and get stuck in the same queues.

## What we built (one end-to-end chain)
1. **Detection** — COCO-SSD (TensorFlow.js) runs in the browser on a camera or video frame of a
   junction and returns vehicle bounding boxes (car, bus, truck, motorcycle).
2. **PCU count** — detections are converted to Passenger Car Units (trotro/bus, truck, car,
   motorcycle weights) to estimate approach flow.
3. **Webster cycle** — F.V. Webster's formula computes the optimum cycle
   `C0 = (1.5·L + 5) / (1 − Y)` and the green split `g_i = (y_i / Y)·(C0 − L)`, plus the expected
   average delay per vehicle.
4. **Signal plan + green wave** — the plan is shown on a Leaflet map of Accra; an ambulance corridor
   is routed with Dijkstra over a small Accra road graph and all junctions on the path are set green.
5. **Telemetry log** — edge nodes (or the included node simulator) POST counts to a serverless
   ingest endpoint; events are stored for the dashboard.

## What is real vs simulated
See the "What is real vs simulated" table in the README. In short: detection, PCU maths, Webster
timing and routing are real computations; the traffic controllers themselves are simulated, because
we have no access to Accra's signal hardware.

## How to verify
1. Open the live app and load the junction video in the vision panel; detections are computed
   locally in your browser.
2. Watch the Webster cycle and the "How we calculate" card update from those counts.
3. Dispatch a green wave on the map.
4. Run the node simulator (`python3 hardware/simulate_esp32_node.py --node TR-01 --once`) against
   the ingest endpoint and see the event appear on the dashboard.
