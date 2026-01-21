USE iot_data;

DROP TABLE IF EXISTS power_logs;
CREATE TABLE power_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    payload JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_time (device_id, created_at)
);

CREATE TABLE IF NOT EXISTS device_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    topic VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_configs (
    device_id VARCHAR(255) PRIMARY KEY,
    visible_fields JSON NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(50) PRIMARY KEY,
    `value` TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO settings (`key`, `value`) VALUES ('mqtt_broker_ip', '');

