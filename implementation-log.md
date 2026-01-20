# Project Implementation Log: IoT over MQTT

This document serves as a comprehensive guide to recreating the IoT project infrastructure, backend, and frontend. It consolidates all implementation steps, troubleshooting resolutions, and configuration details.

---

## 1. Initial Database Security & Troubleshooting

**Issue:** `ERROR 1698 (28000): Access denied for user 'root'@'localhost'` when running `mysql_secure_installation`.

**Cause:** MariaDB on Ubuntu uses the `unix_socket` plugin by default, requiring **sudo** for root access rather than a password.

**Resolution:**
Run the security script with administrative privileges:
```bash
sudo mysql_secure_installation
```

---

## 2. Infrastructure Setup (Docker Compose)

We containerized the core services to ensure isolation and easy resource management on the target hardware (AMD E2-9000e).

### Resource Optimization
To prevent resource exhaustion:
* **Max Connections:** Capped MariaDB connections to `200`.
* **Private Timeouts:** Reduced `wait_timeout` to `300` seconds to clean up idle connections.

### Services Deployed
* **Mosquitto Broker:**
  * Ports: `1883` (MQTT), `9001` (WebSockets)
  * Configured for LAN access.
* **MariaDB:**
  * Port: `3306`
  * Networking: If host MariaDB conflicts, stop it via `sudo systemctl stop mariadb`.

### Directory Structure
```text
~/iot-project/
├── docker-compose.yml
├── mariadb-data/         # Persistent DB storage
├── mosquitto-config/
│   └── mosquitto.conf    # Listener & Auth settings
└── mosquitto-data/       # Persistent MQTT logs
```

---

## 3. IoT Device Configuration (Shelly Plus 1PM)

* **IP Address:** `192.168.0.114`
* **Broker Target:** `192.168.0.178:1883`
* **Status:** Verified connection using `mosquitto_sub`. Device sends JSON status payloads with `online: true`.

---

## 4. Go Backend Integration

A Go service acts as the bridge between the MQTT broker and the MariaDB database.

* **File:** `backend/main.go`
* **Functionality:**
  * Subscribes to `status/switch:0`.
  * Parses JSON payloads for power (W) and voltage (V).
  * Persists data to the `power_logs` table in the `iot_data` database.
* **Dependencies:** `paho.mqtt.golang`, `go-sql-driver/mysql`.

---

## 5. Next.js Frontend Dashboard

A web interface built with Next.js App Router to visualize real-time energy data.

* **Tech Stack:** Next.js, Tailwind CSS, mysql2.
* **Database Connection:**
  * File: `src/lib/db.ts` uses a connection pool.
  * Target: Docker container at `127.0.0.1:3306`.
* **Features:**
  * Real-time display of Wattage and Voltage.
  * Historical logs table.
  * Automatic data revalidation every 5 seconds.

---

## 6. Frontend Troubleshooting & Configuration

We encountered and resolved several specific issues during frontend development.

### Module Resolution Error
**Issue:** `Cannot find module '@/lib/db'`
**Fix:** Updated `tsconfig.json` paths.
* **Change:** Remapped `@/*` from `./*` to `./src/*`.
* **Reason:** The `@` alias must point to the source root where `lib/` resides.

### Missing Root Layout
**Issue:** `Missing <html> and <body> tags in the root layout`
**Fix:** Created `src/app/layout.tsx`.
* **Action:** Added a default RootLayout component wrapping `children` in `<html>` and `<body>` tags, which is required by the Next.js App Router.

---

## Final Project Structure

```text
~/Code/iot-project/
├── docker-compose.yml
├── backend/
│   ├── main.go          # MQTT to DB bridge
│   └── go.mod
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx # Root Layout
    │   │   └── page.tsx   # Dashboard UI
    │   └── lib/db.ts      # DB Connection Utility
    ├── package.json
    └── tsconfig.json    # Path Alias Config
```
