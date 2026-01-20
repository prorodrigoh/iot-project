# IoT Project Installation & Setup Guide

This guide will help you set up the full IoT monitoring stack (MQTT, MariaDB, Go Backend, Next.js Frontend) on your local machine.

## 1. Prerequisites

Ensure you have the following installed:
*   **Docker** & **Docker Compose**
*   **Go** (v1.25 or later)
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
docker-compose up -d
```

Check if containers are running:
```bash
docker ps
```
You should see `mosquitto_broker` (port 1883) and `mariadb_iot` (port 3306).

## 4. Database Initialization

The database `iot_data` is created automatically, but you need to create the table structure manually for the first time.

1.  Access the MariaDB container:
    ```bash
    docker exec -it mariadb_iot mariadb -u go_backend -pgo_password iot_data
    ```

2.  Run the following SQL command to create the logs table:
    ```sql
    CREATE TABLE power_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        device_id VARCHAR(50),
        apower FLOAT,
        voltage FLOAT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```

3.  Exit the database shell:
    ```bash
    exit
    ```

## 5. Configure IoT Device (Shelly Plus 1PM)

You need to point your Shelly device to your computer so it can send data to the MQTT broker.

1.  **Find Device IP**: Connect the Shelly to your Wi-Fi using the manufacturer's app or look for its IP in your router's client list.
2.  **Access Web Interface**: Open a browser and type the device's IP address (e.g., `http://192.168.0.114`).
3.  **Configure MQTT**:
    *   Go to **Settings** -> **MQTT**.
    *   Check **Enable MQTT Network**.
    *   **Server**: Enter *your computer's* local IP address followed by `:1883` (e.g., `192.168.0.178:1883`).
    *   **RPC Status**: Enable "Generic status update over RPC".
    *   Click **Save**.
4.  **Network Settings (Optional)**:
    *   Go to **Settings** -> **Wi-Fi**.
    *   You can set a **Static IP** here if you don't want the device's address to change.

## 6. Start the Backend Data Collector

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

*   **No Data?** Ensure your IoT device (Shelly Plus 1PM) is pointing to your machine's IP address on port `1883` (see Step 5) and that the backend (Step 6) is running.
*   **Timezone Issues?** Timestamps are stored in UTC but displayed in US/Eastern time on the dashboard.
*   **Database Error?** If the backend crashes on start, ensure you ran Step 4 to create the table.
