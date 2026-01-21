1) When the user saves a new device, the device page is not showing the data for the topic that has been subscribed to.

2) When the user clicks on "Enable MQTT & Scan" button, the backend should use the IP provided by the user to verify if the device has MQTT enabled by using the RPC command Shelly.GetConfig and retrieve the true or false value from the json file "mqtt.enable". if the value is TRUE, the device does not need to be rebooted. if the value is FALSE, the device needs to be rebooted.

3) When the user clicks on "Enable MQTT & Scan" button, the backend should use the IP provided by the user to get the device name using the RPC command Shelly.GetConfig and retrieve the name from the json file "sys.device.name".

4) If he user doesn't provide an IP address, in the Settings page, the system should use the "Detected Host IP" and make sure the IP is saved in the database.