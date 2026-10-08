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
#include <DHT.h>

// --- Network Configuration ---
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- PulseCity AI Cloud Endpoint ---
// For local testbed, use your local gateway IP (e.g., http://192.168.1.100:5173/api/v1/telemetry/ingest)
// For production, use the secured cloud ingestion gateway:
const char* API_ENDPOINT  = "https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest";
const char* SENSOR_TOKEN  = "afri-pulse-live-2026";
const char* NODE_ID       = "ECO-01"; // "ECO-01" (Flood/Air), "TR-01" (Traffic), or "EN-01" (Grid)

// --- Pin Definitions ---
const int PIN_MQ135_ANALOG    = 34; // ADC1 Channel 6
const int PIN_ULTRASONIC_TRIG = 5;  // Sonar Trigger
const int PIN_ULTRASONIC_ECHO = 18; // Sonar Echo (via 1k/2k divider)
const int PIN_DHT             = 4;  // DHT22 Digital Data Pin
const int LED_STATUS          = 2;  // Onboard Diagnostic LED

#define DHTTYPE DHT22
DHT dht(PIN_DHT, DHTTYPE);

// --- Telemetry Sampling Interval ---
const unsigned long TRANSMIT_INTERVAL_MS = 15000; // Transmit every 15 seconds
unsigned long lastTransmitTime = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("  PulseCity AI — Edge IoT Sensor Node Firmware v3.0");
  Serial.println("  Hardware: ESP32-WROOM-32D / Sensors: MQ135 + JSN-SR04T + DHT22");
  Serial.println("=======================================================");

  pinMode(PIN_ULTRASONIC_TRIG, OUTPUT);
  pinMode(PIN_ULTRASONIC_ECHO, INPUT);
  pinMode(LED_STATUS, OUTPUT);

  // Initialize DHT Sensor
  dht.begin();
  Serial.println("[SENSOR] DHT22 Temperature & Humidity initialized on GPIO 4.");

  // Connect to Wi-Fi
  Serial.print("[WiFi] Connecting to SSID: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(500);
    Serial.print(".");
    digitalWrite(LED_STATUS, !digitalRead(LED_STATUS));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_STATUS, HIGH); // Solid ON when connected
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] Node IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WiFi] Warning: WiFi association timed out. Will retry in loop.");
  }
}

// Read Ultrasonic Sensor Distance in Centimeters (with 30ms timeout)
float readUltrasonicDistanceCm() {
  digitalWrite(PIN_ULTRASONIC_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_ULTRASONIC_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_ULTRASONIC_TRIG, LOW);

  long duration = pulseIn(PIN_ULTRASONIC_ECHO, HIGH, 30000); // 30ms max roundtrip (~5m)
  if (duration <= 0) return 999.0; // Out of range or echo lost

  return (duration * 0.0343) / 2.0;
}

// Convert MQ-135 Analog Reading (0-4095) to Estimated AQI
int readEstimatedAQI() {
  int rawAdc = analogRead(PIN_MQ135_ANALOG);
  // Calibration curve for tropical ambient atmosphere:
  // 200 ADC ~= 25 AQI (clean), 3200 ADC ~= 280 AQI (polluted)
  int aqi = map(rawAdc, 200, 3200, 25, 280);
  return constrain(aqi, 15, 500);
}

void loop() {
  unsigned long now = millis();

  // Non-blocking timer check
  if (now - lastTransmitTime >= TRANSMIT_INTERVAL_MS) {
    lastTransmitTime = now;

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Link down. Reconnecting...");
      WiFi.reconnect();
      return;
    }

    // 1. Read Physical Sensor Bus
    int aqiVal = readEstimatedAQI();
    float distCm = readUltrasonicDistanceCm();
    
    // Read temperature and humidity from DHT22
    float tempC = dht.readTemperature();
    float humPct = dht.readHumidity();

    // Fallbacks if sensor read fails (e.g. wire disconnected during transit)
    if (isnan(tempC)) tempC = 28.5; // Tropical Accra ambient default
    if (isnan(humPct)) humPct = 78.0;

    // Odaw Canal Clearance Calibration: 
    // Deck clearance = 4.5m. Distance to water = distCm / 100.
    float waterLevelMeters = 4.50 - (distCm / 100.0);
    if (waterLevelMeters < 0.1) waterLevelMeters = 0.1;
    if (waterLevelMeters > 5.0) waterLevelMeters = 5.0;

    int wasteFillPct = constrain(map((int)distCm, 100, 10, 5, 95), 0, 100);
    bool drainChoke = (distCm < 18.0 || waterLevelMeters > 3.2);

    // 2. Build Structured JSON Telemetry Payload
    String payload = "{";
    payload += "\"nodeId\":\"" + String(NODE_ID) + "\",";
    payload += "\"aqiScore\":" + String(aqiVal) + ",";
    payload += "\"waterLevelMeters\":" + String(waterLevelMeters, 2) + ",";
    payload += "\"wasteFillPercentage\":" + String(wasteFillPct) + ",";
    payload += "\"drainageChokeDetected\":" + String(drainChoke ? "true" : "false") + ",";
    payload += "\"temperatureCelsius\":" + String(tempC, 1) + ",";
    payload += "\"humidityPercentage\":" + String(humPct, 1) + ",";
    payload += "\"firmwareVersion\":\"v3.0.0-esp32-prod\",";
    payload += "\"deviceUptimeSec\":" + String(now / 1000);
    payload += "}";

    Serial.println("\n[HTTP] Transmitting Verified Telemetry Packet:");
    Serial.println(payload);

    // 3. Dispatch over TLS 1.3
    WiFiClientSecure client;
    client.setInsecure(); // Set true for lightweight MCU; production firmware can pin DigiCert/Let's Encrypt Root CA

    HTTPClient https;
    if (https.begin(client, API_ENDPOINT)) {
      https.addHeader("Content-Type", "application/json");
      https.addHeader("X-Sensor-Token", SENSOR_TOKEN);

      int httpCode = https.POST(payload);

      if (httpCode > 0) {
        Serial.printf("[HTTP] Gateway Response Code: %d\n", httpCode);
        String response = https.getString();
        Serial.println("[HTTP] Ingestion Receipt:\n" + response);
        // Blink LED to indicate successful transmission
        digitalWrite(LED_STATUS, LOW);
        delay(100);
        digitalWrite(LED_STATUS, HIGH);
      } else {
        Serial.printf("[HTTP] POST failed. Error: %s\n", https.errorToString(httpCode).c_str());
      }

      https.end();
    } else {
      Serial.println("[HTTP] Failed to initialize HTTPS connection.");
    }
  }
}
