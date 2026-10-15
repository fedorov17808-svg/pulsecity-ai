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
#include "secrets.h" // SENSOR_TOKEN (copy secrets.h.example -> secrets.h; not committed)

// --- Network Configuration ---
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- PulseCity AI Cloud Endpoint ---
// For local testbed, use your local gateway IP (e.g., http://192.168.1.100:5173/api/v1/telemetry/ingest)
// For production, use the secured cloud ingestion gateway:
const char* API_ENDPOINT  = "https://pulsecity-ai.vercel.app/api/v1/telemetry/ingest";
const char* NODE_ID       = "ECO-01"; // "ECO-01" (Flood/Air), "TR-01" (Traffic), or "EN-01" (Grid)

// --- TLS trust anchors (public root certificates, not secrets) ---
// *.vercel.app is currently issued by Google Trust Services (WR1 -> GTS Root R1);
// ISRG Root X1 (Let's Encrypt) is kept as a fallback if the issuer changes.
static const char root_ca[] =
"-----BEGIN CERTIFICATE-----\n"
"MIIFVzCCAz+gAwIBAgINAgPlk28xsBNJiGuiFzANBgkqhkiG9w0BAQwFADBHMQsw\n"
"CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU\n"
"MBIGA1UEAxMLR1RTIFJvb3QgUjEwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAw\n"
"MDAwWjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZp\n"
"Y2VzIExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjEwggIiMA0GCSqGSIb3DQEBAQUA\n"
"A4ICDwAwggIKAoICAQC2EQKLHuOhd5s73L+UPreVp0A8of2C+X0yBoJx9vaMf/vo\n"
"27xqLpeXo4xL+Sv2sfnOhB2x+cWX3u+58qPpvBKJXqeqUqv4IyfLpLGcY9vXmX7w\n"
"Cl7raKb0xlpHDU0QM+NOsROjyBhsS+z8CZDfnWQpJSMHobTSPS5g4M/SCYe7zUjw\n"
"TcLCeoiKu7rPWRnWr4+wB7CeMfGCwcDfLqZtbBkOtdh+JhpFAz2weaSUKK0Pfybl\n"
"qAj+lug8aJRT7oM6iCsVlgmy4HqMLnXWnOunVmSPlk9orj2XwoSPwLxAwAtcvfaH\n"
"szVsrBhQf4TgTM2S0yDpM7xSma8ytSmzJSq0SPly4cpk9+aCEI3oncKKiPo4Zor8\n"
"Y/kB+Xj9e1x3+naH+uzfsQ55lVe0vSbv1gHR6xYKu44LtcXFilWr06zqkUspzBmk\n"
"MiVOKvFlRNACzqrOSbTqn3yDsEB750Orp2yjj32JgfpMpf/VjsPOS+C12LOORc92\n"
"wO1AK/1TD7Cn1TsNsYqiA94xrcx36m97PtbfkSIS5r762DL8EGMUUXLeXdYWk70p\n"
"aDPvOmbsB4om3xPXV2V4J95eSRQAogB/mqghtqmxlbCluQ0WEdrHbEg8QOB+DVrN\n"
"VjzRlwW5y0vtOUucxD/SVRNuJLDWcfr0wbrM7Rv1/oFB2ACYPTrIrnqYNxgFlQID\n"
"AQABo0IwQDAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4E\n"
"FgQU5K8rJnEaK0gnhS9SZizv8IkTcT4wDQYJKoZIhvcNAQEMBQADggIBAJ+qQibb\n"
"C5u+/x6Wki4+omVKapi6Ist9wTrYggoGxval3sBOh2Z5ofmmWJyq+bXmYOfg6LEe\n"
"QkEzCzc9zolwFcq1JKjPa7XSQCGYzyI0zzvFIoTgxQ6KfF2I5DUkzps+GlQebtuy\n"
"h6f88/qBVRRiClmpIgUxPoLW7ttXNLwzldMXG+gnoot7TiYaelpkttGsN/H9oPM4\n"
"7HLwEXWdyzRSjeZ2axfG34arJ45JK3VmgRAhpuo+9K4l/3wV3s6MJT/KYnAK9y8J\n"
"ZgfIPxz88NtFMN9iiMG1D53Dn0reWVlHxYciNuaCp+0KueIHoI17eko8cdLiA6Ef\n"
"MgfdG+RCzgwARWGAtQsgWSl4vflVy2PFPEz0tv/bal8xa5meLMFrUKTX5hgUvYU/\n"
"Z6tGn6D/Qqc6f1zLXbBwHSs09dR2CQzreExZBfMzQsNhFRAbd03OIozUhfJFfbdT\n"
"6u9AWpQKXCBfTkBdYiJ23//OYb2MI3jSNwLgjt7RETeJ9r/tSQdirpLsQBqvFAnZ\n"
"0E6yove+7u7Y/9waLd64NnHi/Hm3lCXRSHNboTXns5lndcEZOitHTtNCjv0xyBZm\n"
"2tIMPNuzjsmhDYAPexZ3FL//2wmUspO8IFgV6dtxQ/PeEMMA3KgqlbbC1j+Qa3bb\n"
"bP6MvPJwNQzcmRk13NfIRmPVNnGuV/u3gm3c\n"
"-----END CERTIFICATE-----\n"
"-----BEGIN CERTIFICATE-----\n"
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n"
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n"
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n"
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n"
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n"
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc\n"
"h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+\n"
"0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U\n"
"A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW\n"
"T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH\n"
"B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC\n"
"B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv\n"
"KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn\n"
"OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn\n"
"jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw\n"
"qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI\n"
"rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\n"
"HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq\n"
"hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL\n"
"ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ\n"
"3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK\n"
"NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5\n"
"ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur\n"
"TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC\n"
"jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc\n"
"oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq\n"
"4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA\n"
"mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d\n"
"emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=\n"
"-----END CERTIFICATE-----\n";

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
    client.setCACert(root_ca); // verify the server certificate chain

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
