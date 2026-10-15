# DoraHacks submission: Tech Hub Africa Hackathon 2026

- **Name:** PulseCity AI
- **Track:** Traffic Mitigation
- **Tagline:** Camera-aware signal timing for Accra's trotro-heavy junctions.

## Description

Most junctions in Accra run fixed-time traffic signals. They hand out the same green whatever is
waiting, and that is a poor fit for a road mix dominated by trotro minibuses.

PulseCity AI runs COCO-SSD object detection in the browser (TensorFlow.js), so no video leaves
the device. It converts detections into passenger car units, weighting a trotro more than a car.
From that load it computes F.V. Webster's optimum cycle and green split. It then compares the
expected delay with a fixed 120-second plan on the same flows, and shows the formula behind the
number. For emergencies, it routes an ambulance across a map of Accra's main junctions and sets
a green wave along the path.

Edge nodes post counts to a token-protected API that stores events in Supabase. A Python
simulator stands in for the hardware, so anyone can reproduce the full loop.

We label clearly what is real and what is simulated. The signal controllers are simulated,
because we have no access to Accra's hardware.

Next steps: calibrate the weights with manual counts, train a trotro-specific detector, and run
a read-only pilot on one junction.

## Links

- Live app: https://pulsecity-ai.vercel.app
- Repository: https://github.com/fedorov17808-svg/pulsecity-ai
- Demo video: VIDEO_URL_HERE
