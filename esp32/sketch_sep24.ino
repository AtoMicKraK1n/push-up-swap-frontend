#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// Wi-Fi credentials
const char* ssid = "BSNL FTTH-1";
const char* password = "12345678";

// Backend API endpoint
const char* serverName = "";

// PIR sensor pin
const int pirPin = 15;

// Push-up counter variables
int pushUpCount = 0;
bool lastState = LOW;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 500; // ms

// OLED display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  pinMode(pirPin, INPUT);

  // Initialize OLED
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { // 0x3C is default I2C address
    while (true); // Don't proceed if OLED init fails
  }
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Push-Ups:");
  display.display();

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void loop() {
  int sensorValue = digitalRead(pirPin);

  // Debounce logic
  if (sensorValue != lastState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (sensorValue == HIGH && lastState == LOW) {
      pushUpCount++;

      // Update OLED
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("Push-Ups:");
      display.setCursor(0, 30);
      display.println(pushUpCount);
      display.display();

      // Send HTTPS request
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverName);
        http.addHeader("Content-Type", "application/json");

        String payload = "{\"count\":" + String(pushUpCount) + "}";
        http.POST(payload);
        http.end();
      }
    }
  }

  lastState = sensorValue;
  delay(50);
}
