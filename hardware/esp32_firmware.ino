/*
 * ==============================================================================
 * PulseCity AI — Edge IoT Sensor Node Firmware (ESP32 / ESP8266)
 * Official Microcontroller Code for Tech Hub Africa Hackathon 2026
 * 
 * Hardware Target: ESP32 DevKit v1 ($4.50 USD)
 * Supported Sensors:
 *   - MQ-135 (Air Quality / Hazardous Gas / Smoke) -> Pin GPIO 34 (ADC)
 *   - HC-SR04 (Ultrasonic Drain / Waste Bin Level) -> Trig: 5, Echo: 18
 *   - DHT22 (Temperature & Humidity for Grid Transformers) -> Pin GPIO 4
 *
 * Transmits real-time encrypted telemetry via HTTPS POST to:
 * https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest
 * ==============================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// --- Network Configuration ---
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- PulseCity AI Cloud Endpoint ---
const char* API_ENDPOINT  = "https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest";
const char* SENSOR_TOKEN  = "afri-pulse-live-2026";
const char* NODE_ID       = "ECO-01"; // or "TR-01", "EN-01"

// --- Pin Definitions ---
const int PIN_MQ135_ANALOG   = 34;
const int PIN_ULTRASONIC_TRIG = 5;
const int PIN_ULTRASONIC_ECHO = 18;
const int LED_STATUS         = 2; // Onboard LED

// --- Telemetry Sampling Interval ---
const unsigned long TRANSMIT_INTERVAL_MS = 15000; // Send telemetry every 15s
unsigned long lastTransmitTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[PulseCity AI] Initializing Edge Sensor Node...");

  pinMode(PIN_ULTRASONIC_TRIG, OUTPUT);
  pinMode(PIN_ULTRASONIC_ECHO, INPUT);
  pinMode(LED_STATUS, OUTPUT);

  // Connect to Wi-Fi
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_STATUS, !digitalRead(LED_STATUS));
  }

  digitalWrite(LED_STATUS, HIGH); // Solid ON when connected
  Serial.println("\n[WiFi] Connected successfully!");
  Serial.print("[WiFi] IP Address: ");
  Serial.println(WiFi.localIP());
}

// Read Ultrasonic Sensor Distance in Centimeters
float readUltrasonicDistanceCm() {
  digitalWrite(PIN_ULTRASONIC_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_ULTRASONIC_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_ULTRASONIC_TRIG, LOW);

  long duration = pulseIn(PIN_ULTRASONIC_ECHO, HIGH, 30000); // 30ms timeout
  if (duration == 0) return 999.0; // Out of range

  return (duration * 0.0343) / 2.0;
}

// Convert MQ-135 Analog Reading (0-4095) to Estimated AQI
int readEstimatedAQI() {
  int rawAdc = analogRead(PIN_MQ135_ANALOG);
  // Calibration mapping for tropical urban environment
  int aqi = map(rawAdc, 200, 3200, 25, 280);
  return constrain(aqi, 15, 500);
}

void loop() {
  unsigned long now = millis();

  if (now - lastTransmitTime >= TRANSMIT_INTERVAL_MS) {
    lastTransmitTime = now;

    if (WiFi.status() == WL_CONNECTED) {
      WiFiClientSecure client;
      client.setInsecure(); // Skip SSL certificate root check for lightweight MCU

      HTTPClient https;
      if (https.begin(client, API_ENDPOINT)) {
        https.addHeader("Content-Type", "application/json");
        https.addHeader("X-Sensor-Token", SENSOR_TOKEN);

        // Read physical sensors
        int aqiVal = readEstimatedAQI();
        float distCm = readUltrasonicDistanceCm();
        
        // Compute Waste Bin / Canal Clearance (100cm = empty, 10cm = 90% full)
        int wasteFillPct = constrain(map((int)distCm, 100, 10, 5, 95), 0, 100);
        bool drainChoke = (distCm < 15.0);

        // Build Structured JSON Payload
        String payload = "{";
        payload += "\"nodeId\":\"" + String(NODE_ID) + "\",";
        payload += "\"aqiScore\":" + String(aqiVal) + ",";
        payload += "\"wasteFillPercentage\":" + String(wasteFillPct) + ",";
        payload += "\"drainageChokeDetected\":" + String(drainChoke ? "true" : "false") + ",";
        payload += "\"firmwareVersion\":\"v2.4.0-esp32\"";
        payload += "}";

        Serial.println("\n[HTTP] Transmitting Telemetry Payload:");
        Serial.println(payload);

        int httpCode = https.POST(payload);

        if (httpCode > 0) {
          Serial.printf("[HTTP] Response Code: %d\n", httpCode);
          String response = https.getString();
          Serial.println("[HTTP] Server Response:\n" + response);
        } else {
          Serial.printf("[HTTP] POST failed, error: %s\n", https.errorToString(httpCode).c_str());
        }

        https.end();
      }
    } else {
      Serial.println("[WiFi] Lost connection. Reconnecting...");
      WiFi.reconnect();
    }
  }
}
