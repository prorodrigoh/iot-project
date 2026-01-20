export const revalidate = 5; // Re-fetch data every 5 seconds

import { pool } from '@/lib/db';

async function getPowerLogs() {
  const [rows] = await pool.query('SELECT * FROM power_logs ORDER BY timestamp DESC LIMIT 10');
  return rows as any[];
}

export default async function Home() {
  const logs = await getPowerLogs();

  return (
    <main className="p-8 font-sans">
      <h1 className="text-2xl font-bold mb-6">IoT Power Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-blue-100 rounded-lg shadow">
          <p className="text-sm text-blue-600 font-semibold">Latest Power Reading</p>
          <p className="text-4xl font-mono">{logs[0]?.apower || 0} W</p>
        </div>
        <div className="p-6 bg-green-100 rounded-lg shadow">
          <p className="text-sm text-green-600 font-semibold">Current Voltage</p>
          <p className="text-4xl font-mono">{logs[0]?.voltage || 0} V</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Time</th>
              <th className="p-3 text-left">Power (W)</th>
              <th className="p-3 text-left">Voltage (V)</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b">
                <td className="p-3">{new Date(log.timestamp).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}</td>
                <td className="p-3 font-mono">{log.apower}</td>
                <td className="p-3 font-mono">{log.voltage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

