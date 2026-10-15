# OpenCV AI Competition 2026 submission

- **Project:** PulseCity AI
- **Links:** https://pulsecity-ai.vercel.app · https://github.com/fedorov17808-svg/pulsecity-ai · video: VIDEO_URL_HERE

## Description

PulseCity AI turns a junction camera frame into a traffic-signal plan for Accra, Ghana.

**Technical execution.** COCO-SSD (TensorFlow.js) detects vehicles directly in the browser on a
webcam, an uploaded video or a photo. Detections become passenger car units, which drive
F.V. Webster's optimum cycle `C0 = (1.5L + 5)/(1 − Y)`, the green split and the average-delay
formula. Unit tests check these against hand-worked examples.

**Innovation.** PCU weighting reflects trotro-dominated traffic. The app compares the computed
plan with a fixed 120-second cycle on the same flows, and reports "oversaturated" instead of an
invented saving.

**Real-world impact.** Inference runs on the device, so the setup needs no GPU server and no
video upload. Emergency green waves are routed with Dijkstra.

**UX.** Live bounding boxes, a "how we calculate" formula tooltip, and Simulated badges wherever
data is not measured.

**Documentation.** The README covers architecture, a real-vs-simulated table, setup and tests.

**Cloud delivery and reproducibility.** The app is deployed on Vercel, telemetry is stored in
Supabase, and an included Python node simulator reproduces the full loop.

Signal controllers are simulated.
