USE iot_data;

-- Drop existing tables in reverse order of dependencies
DROP TABLE IF EXISTS power_logs;
DROP TABLE IF EXISTS subscribed_topics;
DROP TABLE IF EXISTS dashboard_configs;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS settings;

-- 1. Devices table (Hash IDs)
CREATE TABLE devices (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    ip VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Topics table (Associated with devices)
CREATE TABLE subscribed_topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(36) NOT NULL,
    topic VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- 3. Dashboard Configurations
CREATE TABLE dashboard_configs (
    device_id VARCHAR(36) PRIMARY KEY,
    visible_fields JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Power Logs
CREATE TABLE power_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(36) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    payload JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_time (device_id, created_at)
);

-- 5. Settings
CREATE TABLE settings (
    `key` VARCHAR(50) PRIMARY KEY,
    `value` TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Initialize default settings
INSERT INTO settings (`key`, `value`) VALUES ('mqtt_broker_ip', '');
