package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	_ "github.com/go-sql-driver/mysql"
)

// Global variables
var (
	db         *sql.DB
	mqttClient mqtt.Client
)

// --- Database Models ---

type DashboardConfig struct {
	DeviceID      string   `json:"device_id"`
	VisibleFields []string `json:"visible_fields"`
}

type DeviceSubscription struct {
	Topic      string `json:"topic"`
	DeviceName string `json:"device_name"`
}

// --- HTTP Handlers ---

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func handleSubscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var sub DeviceSubscription
	if err := json.NewDecoder(r.Body).Decode(&sub); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 1. Save to DB
	_, err := db.Exec("INSERT INTO device_subscriptions (topic, device_name) VALUES (?, ?)", sub.Topic, sub.DeviceName)
	if err != nil {
		// Ignore duplicate error for simplicity or handle it
		log.Printf("Error saving subscription: %v", err)
	}

	// 2. Subscribe MQTT
	subscribeToTopic(sub.Topic)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "subscribed"})
}

func handleDashboardConfig(w http.ResponseWriter, r *http.Request) {
	deviceID := r.PathValue("id")
	if deviceID == "" {
		http.Error(w, "Missing device ID", http.StatusBadRequest)
		return
	}

	if r.Method == http.MethodGet {
		var fieldsJSON string
		err := db.QueryRow("SELECT visible_fields FROM dashboard_configs WHERE device_id = ?", deviceID).Scan(&fieldsJSON)
		if err == sql.ErrNoRows {
			json.NewEncoder(w).Encode(DashboardConfig{DeviceID: deviceID, VisibleFields: []string{}})
			return
		} else if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(fmt.Sprintf(`{"device_id": "%s", "visible_fields": %s}`, deviceID, fieldsJSON)))

	} else if r.Method == http.MethodPost {
		var config DashboardConfig
		if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		fieldsJSON, err := json.Marshal(config.VisibleFields)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		_, err = db.Exec("INSERT INTO dashboard_configs (device_id, visible_fields) VALUES (?, ?) ON DUPLICATE KEY UPDATE visible_fields = ?",
			deviceID, string(fieldsJSON), string(fieldsJSON))
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func handleDiscover(w http.ResponseWriter, r *http.Request) {
	ip := r.URL.Query().Get("ip")
	if ip == "" {
		http.Error(w, "Missing 'ip' query parameter", http.StatusBadRequest)
		return
	}

	client := &http.Client{Timeout: 3 * time.Second}
	var prefix string
	var enabled bool

	// 1. Try Shelly Gen 2/3 (RPC)
	// http://<ip>/rpc/MQTT.GetConfig
	resp, err := client.Get(fmt.Sprintf("http://%s/rpc/MQTT.GetConfig", ip))

	if err == nil && resp.StatusCode == http.StatusOK {
		var result struct {
			TopicPrefix string `json:"topic_prefix"`
			Enable      bool   `json:"enable"`
		}
		if json.NewDecoder(resp.Body).Decode(&result) == nil {
			prefix = result.TopicPrefix
			enabled = result.Enable
			log.Printf("Scanner: Found Gen 2/3 device at %s (prefix: %s)", ip, prefix)
		}
		resp.Body.Close()
	} else {
		if err != nil {
			log.Printf("Scanner: Gen 2/3 check failed for %s: %v", ip, err)
		} else {
			log.Printf("Scanner: Gen 2/3 check returned %d", resp.StatusCode)
			resp.Body.Close()
		}

		// 2. Fallback: Try Shelly Gen 1
		// http://<ip>/settings
		respGen1, errGen1 := client.Get(fmt.Sprintf("http://%s/settings", ip))
		if errGen1 != nil {
			http.Error(w, fmt.Sprintf("Failed to contact device (tried Gen2 and Gen1): %v", errGen1), http.StatusBadGateway)
			return
		}
		defer respGen1.Body.Close()

		if respGen1.StatusCode != http.StatusOK {
			http.Error(w, fmt.Sprintf("Device returned status: %d", respGen1.StatusCode), http.StatusBadGateway)
			return
		}

		var resultGen1 struct {
			Mqtt struct {
				Enable bool   `json:"enable"`
				Id     string `json:"id"`
			} `json:"mqtt"`
		}
		if json.NewDecoder(respGen1.Body).Decode(&resultGen1) != nil {
			http.Error(w, "Failed to parse Gen 1 device response", http.StatusInternalServerError)
			return
		}

		// Gen 1 usually follows pattern "shellies/<mqtt-id>/"
		prefix = fmt.Sprintf("shellies/%s", resultGen1.Mqtt.Id)
		enabled = resultGen1.Mqtt.Enable
		log.Printf("Scanner: Found Gen 1 device at %s (id: %s)", ip, resultGen1.Mqtt.Id)
	}

	// Suggest topics
	if prefix == "" {
		prefix = "shelly-unknown"
	}

	// Helper to handle trailing slashes which some devices might emit? Usually not.
	// But Gen 1 usually needs explicit "shellies/room/..."

	topics := []string{
		fmt.Sprintf("%s/events/rpc", prefix),
		fmt.Sprintf("%s/status/switch:0", prefix),
		fmt.Sprintf("%s/relay/0", prefix),  // Gen 1 pattern
		fmt.Sprintf("%s/emeter/0", prefix), // Gen 1 pattern
		fmt.Sprintf("%s/temperature", prefix),
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"mqtt_enabled": enabled,
		"topic_prefix": prefix,
		"suggestions":  topics,
	})
}

// Helper to get preferred outbound ip of this machine
func getOutboundIP() string {
	conn, err := net.Dial("udp", "8.8.8.8:80")
	if err != nil {
		return "127.0.0.1"
	}
	defer conn.Close()
	localAddr := conn.LocalAddr().(*net.UDPAddr)
	return localAddr.IP.String()
}

func getBrokerIP() string {
	var override string
	err := db.QueryRow("SELECT `value` FROM settings WHERE `key` = 'mqtt_broker_ip'").Scan(&override)
	if err == nil && override != "" {
		return override
	}
	return getOutboundIP()
}

func handleSystemInfo(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		ip := getBrokerIP()
		detected := getOutboundIP()

		var override string
		db.QueryRow("SELECT `value` FROM settings WHERE `key` = 'mqtt_broker_ip'").Scan(&override)

		json.NewEncoder(w).Encode(map[string]interface{}{
			"ip":       ip,
			"detected": detected,
			"override": override,
			"port":     1883,
		})
	} else if r.Method == http.MethodPost {
		var req struct {
			IP string `json:"ip"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		_, err := db.Exec("INSERT INTO settings (`key`, `value`) VALUES ('mqtt_broker_ip', ?) ON DUPLICATE KEY UPDATE `value` = ?", req.IP, req.IP)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func handleConfigureDevice(w http.ResponseWriter, r *http.Request) {
	// Expects: { "device_ip": "192.168.x.x" }
	var req struct {
		DeviceIP string `json:"device_ip"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hostIP := getBrokerIP()
	mqttServer := fmt.Sprintf("%s:1883", hostIP)

	log.Printf("Configuring device %s to use MQTT server: %s", req.DeviceIP, mqttServer)

	// Shelly Gen 2/3 RPC: MQTT.SetConfig
	configPayload := map[string]interface{}{
		"id":     1,
		"method": "MQTT.SetConfig",
		"params": map[string]interface{}{
			"config": map[string]interface{}{
				"enable":       true,
				"server":       mqttServer,
				"topic_prefix": nil, // Keep existing or let it default
			},
		},
	}

	client := &http.Client{Timeout: 5 * time.Second}

	// 1. Try Gen 2/3 RPC
	body, _ := json.Marshal(configPayload)
	resp, err := client.Post(fmt.Sprintf("http://%s/rpc", req.DeviceIP), "application/json", bytes.NewBuffer(body))

	if err == nil && resp.StatusCode == http.StatusOK {
		log.Printf("Successfully configured Gen 2/3 device %s", req.DeviceIP)
		resp.Body.Close()
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "configured", "type": "gen2"})
		return
	}

	// 2. Try Gen 1 API (/settings/mqtt)
	// Needs form data: enabled=1&server=192.168.x.x:1883
	// Note: Gen 1 uses GET arguments or POST form data usually

	gen1Url := fmt.Sprintf("http://%s/settings/mqtt?mqtt_enable=true&mqtt_server=%s", req.DeviceIP, mqttServer)
	respGen1, errGen1 := client.Get(gen1Url) // Using GET for simplicity as many Shellies accept it

	if errGen1 == nil && respGen1.StatusCode == http.StatusOK {
		log.Printf("Successfully configured Gen 1 device %s", req.DeviceIP)
		respGen1.Body.Close()
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "configured", "type": "gen1"})
		return
	}

	errMsg := "Failed to configure device. "
	if err != nil {
		errMsg += fmt.Sprintf("Gen2 Error: %v. ", err)
	}
	if errGen1 != nil {
		errMsg += fmt.Sprintf("Gen1 Error: %v. ", errGen1)
	}

	http.Error(w, errMsg, http.StatusBadGateway)
}

func handleBackfill(w http.ResponseWriter, r *http.Request) {
	// Helper to get available devices from logs
	rows, err := db.Query("SELECT DISTINCT device_id FROM power_logs")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var devices []string
	for rows.Next() {
		var d string
		rows.Scan(&d)
		devices = append(devices, d)
	}
	json.NewEncoder(w).Encode(devices)
}

// --- MQTT Logic ---

func subscribeToTopic(topic string) {
	if mqttClient == nil || !mqttClient.IsConnected() {
		log.Println("MQTT client not connected, skipping subscribe")
		return
	}
	token := mqttClient.Subscribe(topic, 1, nil)
	token.Wait()
	if token.Error() != nil {
		log.Printf("Error subscribing to %s: %v", topic, token.Error())
	} else {
		log.Printf("Subscribed to %s", topic)
	}
}

var messageHandler mqtt.MessageHandler = func(client mqtt.Client, msg mqtt.Message) {
	payload := string(msg.Payload())
	topic := msg.Topic()

	// Heuristic to extract a "device_id" from topic.
	// E.g. "shellyplus1pm-a8032ab5f58c/status/switch:0" -> "shellyplus1pm-a8032ab5f58c"
	// This is a naive implementation; user might want 'device_name' from DB.

	// Better approach: Check if we have a mapped name in device_subscriptions
	var deviceID string
	err := db.QueryRow("SELECT device_name FROM device_subscriptions WHERE topic = ?", topic).Scan(&deviceID)
	if err != nil {
		// Fallback: use the part before first slash
		parts := strings.Split(topic, "/")
		if len(parts) > 0 {
			deviceID = parts[0]
		} else {
			deviceID = "unknown"
		}
	}

	// Determine if payload is JSON
	if !json.Valid([]byte(payload)) {
		// Log warning or wrap it
		log.Printf("Received non-JSON payload on %s: %s", topic, payload)
		// Option: wrap in object, e.g. {"value": ...} or ignore.
		// For now, let's assume it MUST be JSON or we wrap it
		payload = fmt.Sprintf(`{"raw_value": "%s"}`, strings.ReplaceAll(payload, `"`, `\"`))
	}

	_, err = db.Exec("INSERT INTO power_logs (device_id, topic, payload) VALUES (?, ?, ?)",
		deviceID, topic, payload)

	if err != nil {
		log.Printf("Error saving log: %v", err)
	} else {
		// log.Printf("Saved log for %s", deviceID)
	}
}

func main() {
	var err error

	// 1. Connect to DB
	dsn := "go_backend:go_password@tcp(127.0.0.1:3306)/iot_data"
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Wait for DB?
	db.SetConnMaxLifetime(time.Minute * 3)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)

	if err = db.Ping(); err != nil {
		log.Printf("Warning: DB ping failed: %v", err)
	}

	// Schema initialization
	db.Exec(`CREATE TABLE IF NOT EXISTS settings (
		` + "`key`" + ` VARCHAR(50) PRIMARY KEY,
		` + "`value`" + ` TEXT NOT NULL,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	)`)
	db.Exec("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('mqtt_broker_ip', '')")

	// 2. MQTT Setup
	opts := mqtt.NewClientOptions().AddBroker("tcp://localhost:1883")
	opts.SetClientID("go_backend_subscriber_v2")
	opts.SetDefaultPublishHandler(messageHandler)

	mqttClient = mqtt.NewClient(opts)
	if token := mqttClient.Connect(); token.Wait() && token.Error() != nil {
		log.Fatal(token.Error())
	}
	log.Println("Connected to MQTT Broker")

	// 3. Load Valid Subscriptions from DB
	rows, err := db.Query("SELECT topic FROM device_subscriptions")
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var t string
			rows.Scan(&t)
			subscribeToTopic(t)
		}
	} else {
		// If table is empty or error, maybe subscribe to default?
		// Let's just log.
		log.Printf("No existing subscriptions found or error: %v", err)
	}

	// 4. HTTP Server
	router := http.NewServeMux()
	router.HandleFunc("POST /api/subscribe", handleSubscribe)
	router.HandleFunc("GET /api/devices/{id}/config", handleDashboardConfig)
	router.HandleFunc("POST /api/devices/{id}/config", handleDashboardConfig)
	router.HandleFunc("GET /api/devices", handleBackfill)
	router.HandleFunc("GET /api/discover", handleDiscover)
	router.HandleFunc("GET /api/system-info", handleSystemInfo)
	router.HandleFunc("POST /api/system-info", handleSystemInfo)
	router.HandleFunc("POST /api/configure", handleConfigureDevice)

	server := &http.Server{
		Addr:    ":8080",
		Handler: enableCORS(router),
	}

	log.Println("HTTP Server listening on :8080")
	log.Fatal(server.ListenAndServe())
}
