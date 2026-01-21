# User Manual: IoT Dashboard

Welcome to your IoT Monitoring Dashboard. This guide will walk you through setting up and using the application to monitor your Shelly devices.

## 1. Getting Started

When you first open the application at `http://localhost:3000`, you will land on the **Global Overview**.

### Global Overview
This is your command center. It shows:
- **Active Devices**: Total number of unique devices registered.
- **Total Events Logged**: A lifetime count of every data point received.
- **System Health**: Status of the backend and database services.
- **Recent Activity**: A live-feed table of the last 10 messages received across all devices.

---

## 2. Setting Up Your Environment

Before adding devices, ensure your system is correctly configured.

1.  Click **Settings** in the sidebar.
2.  **Detected Host IP**: The system automatically detects your computer's LAN IP. This is where your Shelly devices will send their data.
3.  **Broker IP Override**: If you have a specific IP you want the devices to use (or if autodetection is incorrect), enter it here.
4.  Click **Save Configuration**. The system will now use this IP for all future device configurations.

---

## 3. Adding a New Device (Subscription)

Click **New Subscription** in the sidebar to begin. There are two ways to add a device:

### A. Scan IP (Recommended for Shelly Gen 2/3)
This is the easiest way to add modern Shelly devices (Plus, Pro, etc.).
1.  Enter the **Device IP Address** of your Shelly.
2.  Set the **Reporting Interval** (how often the device sends data, e.g., 30 seconds).
3.  Click **Enable MQTT & Scan**.
    - The dashboard will remotely configure your Shelly to point to this server.
    - The device will automatically **reboot** (takes ~5 seconds).
    - The system will then show a list of **Discovered Topics**.
4.  Click on a suggested topic (e.g., `shellyplus1pm-xxxx/status/switch:0`) to select it.
5.  Set a friendly **Device Name** (e.g., "Kitchen Fridge").
6.  Click **Start Listening**.

### B. Manual Entry
Use this if you already know the MQTT topic or for older Gen 1 devices.
1.  **MQTT Topic**: Enter the exact topic (e.g., `shellies/room/relay/0`).
2.  **Device Name**: Enter a friendly label.
3.  **Optional Configuration**: Toggle "Device Configuration" if you want the dashboard to automatically set the device's MQTT settings via its IP before subscribing.

---

## 4. Monitoring Devices

Click **Connected Devices** to see your fleet. Each card shows:
- **Friendly Name**: The name you assigned.
- **Last Seen**: When the device last sent a message.
- **Message Count**: Total data points for this device.
- **Hash ID**: Hover over the name to see the internal unique ID.

### Individual Device Dashboard
Click on any device card to see its specific data:
- **Real-time Charts**: Automatically generated for any numeric data (Power, Voltage, Temperature).
- **Data Cards**: Shows the latest value for every field in the MQTT message.
- **Device IP Link**: Click the IP address under the name to open the Shelly's own web interface in a new tab.

### Customizing the View
Not all data is useful. You can hide or show specific fields:
1.  On a device page, click **Customize View**.
2.  Check or uncheck the fields you want to see.
3.  Click **Save Changes**. Your preference is saved specifically for *that* device.

---

## 5. Removing a Device

If you no longer wish to monitor a device:
1.  Go to the device's specific dashboard.
2.  Click **Remove Device** in the top right.
3.  Confirm the deletion.
    - **Warning**: This will permanently delete all historical logs for this device and its configuration. The backend will also stop listening to that topic.

---

## Troubleshooting Tips

- **"No fields Selected"**: If you just added a device, it might take a few seconds for the first message to arrive. Once it does, the data cards will appear automatically.
- **Dashboard not updating**: Ensure the **Go Backend** terminal is running and shows "MQTT message received".
- **Wrong IP in Link**: Make sure you provided the correct IP during the "New Subscription" step; otherwise, the shortcut link will not work.
