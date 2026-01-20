import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: '127.0.0.1',
  user: 'go_backend',
  password: 'go_password',
  database: 'iot_data',
  port: 3306,
  timezone: 'Z',
});
