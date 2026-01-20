Based on the document you provided, here is the content converted into a clean, structured Markdown format.

---

# Project: IOT over MQTT

## Goals

1. 
**Mosquitto Broker:** Run a Mosquitto Broker on a LAN to allow IoT devices to publish data. 


2. 
**Go Backend:** Create a backend using **Go** to subscribe to topics, retrieve data, and save it. 


3. 
**Next.js Frontend:** Create a frontend using **Next.js** to display data and interact with IoT devices to publish new topics. 



---

## Environment

### Hardware Information

* **Model:** HP Laptop 14-bw0xx
* **Memory:** 8.0 GiB
* 
**Processor:** AMD E2-9000e RADEON R2, 4 COMPUTE CORES 2C+2G × 2 


* **Graphics:** AMD Radeon™ R2 Graphics
* 
**Disk Capacity:** 500.1 GB 



### Software Information

* 
**OS:** Ubuntu 24.04.3 LTS 


* **OS Type:** 64-bit
* **GNOME Version:** 46
* 
**Windowing System:** Wayland 


* **Kernel Version:** Linux 6.14.0-37-generic
* **Firmware:** F.26

---

## Tech Stack & Documentation

| Tool | Version / URL |
| --- | --- |
| **Mosquitto MQTT** | [Manual](https://mosquitto.org/man/) |
| **Docker** | [Manual](https://docs.docker.com/manuals/) |
| **MariaDB** | [Manual](https://mariadb.com/docs) |
| **Next.js** | [Documentation](https://nextjs.org/docs) |
| **Node.js** | v24.13.0 |
| **npm** | 11.6.2 |
| **Go** | go1.25.6 linux/amd64 |

---

## IoT Device Configuration (Shelly)

### Device Documentation

* [Shelly MQTT Component Docs](https://shelly-api-docs.shelly.cloud/gen2/ComponentsAndServices/Mqtt/)
* [Shelly Gen2 Device Docs](https://shelly-api-docs.shelly.cloud/gen2/)

### Test Device: Shelly Plus 1PM

* **Product Page:** [Shelly Plus 1PM](https://shelly-api-docs.shelly.cloud/gen2/Devices/Gen2/ShellyPlus1PM)
* **IP Address:** `192.168.0.139`
* **MQTT Broker:** `192.168.0.139:1883`
* **RPC Status Notifications:** Enabled
* **Generic Status over MQTT:** Enabled
* 
**SSL Connectivity:** Disabled 



---

