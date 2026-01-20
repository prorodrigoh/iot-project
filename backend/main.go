package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	_ "github.com/go-sql-driver/mysql"
)

// ShellyStatus represents the JSON structure from the device
type ShellyStatus struct {
	Apower  float64 `json:"apower"`
	Voltage float64 `json:"voltage"`
}

func main() {
	// 1. Connect to MariaDB
	dsn := "go_backend:go_password@tcp(127.0.0.1:3306)/iot_data"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// 2. MQTT Setup
	opts := mqtt.NewClientOptions().AddBroker("tcp://localhost:1883")
	opts.SetClientID("go_backend_subscriber")

	messageHandler := func(client mqtt.Client, msg mqtt.Message) {
		var status ShellyStatus
		err := json.Unmarshal(msg.Payload(), &status)
		if err != nil {
			return // Skip if it's not the status JSON we expect
		}

		// 3. Save to Database
		_, err = db.Exec("INSERT INTO power_logs (device_id, apower, voltage) VALUES (?, ?, ?)", 
			"shelly-1pm", status.Apower, status.Voltage)
		
		if err == nil {
			fmt.Printf("Saved: %.2fW at %.2fV\n", status.Apower, status.Voltage)
		}
	}

	opts.SetDefaultPublishHandler(messageHandler)
	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatal(token.Error())
	}

	// Subscribe to the status topic
	topic := "shellyplus1pm-a8032ab5f58c/status/switch:0"
	client.Subscribe(topic, 1, nil)

	fmt.Println("Backend is listening for Shelly data...")
	select {} // Keep the program running
}
