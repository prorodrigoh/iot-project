# IoT Project Installation & Setup Guide

This guide will help you set up the full IoT monitoring stack (MQTT, MariaDB, Go Backend, Next.js Frontend) on your local machine.

## 1. Prerequisites

Ensure you have the following installed:
*   **Docker** & **Docker Compose**
*   **Go** (v1.25.5 or later)
*   **Node.js** (v18 or later) & **npm**
*   **Git**

## 2. Clone the Repository

```bash
git clone <repository-url>
cd iot-project
```

## 3. Infrastructure Setup (Docker)

Start the MQTT Broker and MariaDB Database containers.

```bash
docker compose up -d
```

> [!IMPORTANT]
> **Conflict with Snap Mosquitto:** If you have Mosquitto installed via Ubuntu Snap, it may block port 1883. If `docker ps` doesn't show the port mapping or you get "Connection Refused", run:
> ```bash
> sudo snap stop mosquitto
> sudo snap disable mosquitto
> docker compose up -d --force-recreate
> ```

Check if containers are running:
```bash
docker ps
```
You should see `mosquitto_broker` (port 1883) and `mariadb_iot` (port 3306).

## 4. Database Initialization

The database `iot_data` is created automatically by the Docker container, but you need to initialize the table structure.

1.  **Initialize using migration script** (Recommended):
    ```bash
    docker exec -i mariadb_iot mariadb -u go_backend -pgo_password iot_data < migration.sql
    ```

    Then run the SQL commands found in `migration.sql`.

3.  **Clean Reset** (Wipes all data and resets schema):
    ```bash
    mariadb -h 127.0.0.1 -u go_backend -pgo_password iot_data < clean_reset.sql
    ```

6.  **Auto-Configuration (Recommended)**: 
    Instead of manual setup, you can use the **New Subscription** -> **Scan IP** feature in the dashboard. The system will automatically configure these settings and reboot the device for you.

## 6. Dashboard Configuration (First Run)

Before adding devices, tell the system your computer's IP:
1.  Open the dashboard: [http://localhost:3000](http://localhost:3000)
2.  Go to **Settings**.
3.  Verify the **Detected Host IP**. If you are on a VPN or have multiple adapters, you may need to override this with your LAN IP.
4.  Click **Save Configuration**.

## 7. Start the Backend Data Collector

The Go service subscribes to the MQTT broker and saves data to the database.

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    go mod tidy
    ```

3.  Run the collector:
    ```bash
    go run main.go
    ```
    *   *Keep this terminal window open.* You should see "Backend is listening for Shelly data..."

## 7. Start the Frontend Dashboard

The Next.js web interface visualizes the data.

1.  Open a **new terminal** and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser and visit:
    [http://localhost:3000](http://localhost:3000)

## 8. Troubleshooting

*   **No Data?** 
    - Ensure your IoT device (Shelly Plus 1PM) is pointing to your machine's IP address on port `1883`.
    - Verify the broker is listening externally: `ss -tulpn | grep 1883` (should show `0.0.0.0:1883` or `*:1883`).
    - Verify connectivity with `nc -zv <HOST_IP> 1883`.
*   **Mosquitto Logs?** If `docker logs mosquitto_broker` is empty, check the internal log file:
    ```bash
    docker exec mosquitto_broker cat /mosquitto/log/mosquitto.log
    ```
*   **Timezone Issues?** Timestamps are stored in UTC but displayed in local time on the dashboard.
*   **Database Error?** Check if tables exist: `mariadb -h 127.0.0.1 -u go_backend -pgo_password iot_data -e "SHOW TABLES;"`
