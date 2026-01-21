USE iot_data;

-- 1. Create the new devices table
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(36) PRIMARY KEY, -- Hash (MD5) of device name
    name VARCHAR(255) NOT NULL UNIQUE,
    ip VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the new topics table
CREATE TABLE IF NOT EXISTS subscribed_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(36) NOT NULL,
    topic VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 3. Migrate data from device_subscriptions to the new tables
INSERT IGNORE INTO devices (id, name)
SELECT DISTINCT MD5(device_name), device_name FROM device_subscriptions;

INSERT IGNORE INTO subscribed_topics (device_id, topic)
SELECT MD5(device_name), topic FROM device_subscriptions;

-- 4. Update power_logs to use hash IDs
-- First, add temporary column to power_logs if needed or just update
UPDATE power_logs 
SET device_id = MD5(device_id) 
WHERE device_id IN (SELECT name FROM devices);
-- Note: This assumes power_logs.device_id currently contains the name string.

-- 5. Update dashboard_configs to use hash IDs
-- We need to handle this carefully because device_id is a primary key.
-- We'll create a temp table or do a replace.
CREATE TABLE IF NOT EXISTS dashboard_configs_new (
    device_id VARCHAR(36) PRIMARY KEY,
    visible_fields JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO dashboard_configs_new (device_id, visible_fields, updated_at)
SELECT MD5(device_id), visible_fields, updated_at FROM dashboard_configs;

DROP TABLE dashboard_configs;
RENAME TABLE dashboard_configs_new TO dashboard_configs;

-- 6. Cleanup (Optional: keep device_subscriptions for backup until verified)
-- DROP TABLE device_subscriptions;
