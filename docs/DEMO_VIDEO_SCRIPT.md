# Demo video script (2:00)

Record at 1080p with the live app (https://pulsecity-ai.vercel.app) or `npm run dev`.
Before recording, start the node simulator in a terminal that is ready to show
(see README, "Run locally"), and paste the sensor token in the IoT Gateway tab.

| Time | On screen | Say |
|---|---|---|
| 0:00–0:15 | Kwame Nkrumah Circle photo in the TrotroFlow panel; map of Accra behind it. | "Most junctions in Accra run fixed-time signals. They give the same green whether the queue is two cars or twenty trotros. PulseCity AI times the lights from what a camera actually sees." |
| 0:15–0:30 | Open the vision panel. Upload a short junction video (or use the sample photo). Bounding boxes appear. | "This is COCO-SSD running in the browser with TensorFlow.js. No video leaves the device, so it works on a cheap laptop or phone at the roadside." |
| 0:30–0:45 | Point at the box labels (each shows its PCU weight) and the recommendation line with the PCU load. | "Each vehicle gets a passenger-car-unit weight. A trotro counts as 2.2 cars, a truck as 3. COCO-SSD has no trotro class, so we count buses. That's honest, and it's on our roadmap to fix." |
| 0:45–1:10 | Webster box: cycle C0, green split. Hover "how we calculate" to show the formula and the fixed-vs-Webster delay. | "From the PCU load we compute Webster's optimum cycle: 1.5 L plus 5, over 1 minus Y. Green is split by each phase's flow ratio. We compare it with a fixed 120-second plan on the same flows using Webster's delay formula. If the fixed plan can't cope, the app says 'oversaturated' instead of inventing a number." |
| 1:10–1:35 | Map: pick Circle to 37 Military Hospital, click "Dispatch Green Wave". The route turns green and the ambulance moves. | "For emergencies we route the ambulance with Dijkstra over Accra's main junctions and turn every light on the path green. The time saved is the expected wait at each fixed signal, about 17 seconds per junction. The signals here are simulated: we don't have access to Accra's controllers." |
| 1:35–1:50 | Terminal: run `simulate_esp32_node.py --node TR-01 --once`, see `201`. Switch to the app: the packet counter goes up and TR-01's input changes from "Simulated" to "Telemetry". | "Edge nodes post counts to our API. Here the included simulator plays the node. The event is stored in Supabase, and the dashboard picks it up within three seconds." |
| 1:50–2:00 | README "What is real vs simulated" table, then the GitHub URL. | "Next: calibrate the weights with real counts at one junction, train a trotro detector, and pilot read-only on a real controller. Everything is open source. Thanks for watching." |
