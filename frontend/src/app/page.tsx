import { pool } from '@/lib/db';
import Link from 'next/link';
import { Activity, Zap, Cpu, Clock } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getStats() {
  const [deviceRows] = await pool.query('SELECT COUNT(DISTINCT device_id) as count FROM power_logs');
  const [logRows] = await pool.query('SELECT COUNT(*) as count FROM power_logs');
  // Latest 10 logs
  const [latestLogs] = await pool.query('SELECT * FROM power_logs ORDER BY created_at DESC LIMIT 10');

  return {
    deviceCount: (deviceRows as any[])[0].count,
    logCount: (logRows as any[])[0].count,
    latestLogs: latestLogs as any[],
  };
}


async function getSystemInfo() {
  try {
    const res = await fetch('http://localhost:8080/api/system-info', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export default async function Home() {
  const { deviceCount, logCount, latestLogs } = await getStats();
  const sysInfo = await getSystemInfo();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Global Overview
          </h1>
          <p className="text-slate-400 mt-1">Real-time system monitoring</p>
        </div>
        {sysInfo && (
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">MQTT Broker</p>
            <p className="text-sm font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
              {sysInfo.ip}:{sysInfo.port}
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Cpu className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-400 mb-1">Active Devices</p>
            <h3 className="text-4xl font-bold text-white mb-2">{deviceCount}</h3>
            <div className="flex items-center text-xs text-green-400">
              <Activity className="w-3 h-3 mr-1" />
              <span>Systems Operational</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-24 h-24 text-purple-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-400 mb-1">Total Events Logged</p>
            <h3 className="text-4xl font-bold text-white mb-2">{logCount}</h3>
            <p className="text-xs text-slate-500">Lifetime system events</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="w-24 h-24 text-yellow-500" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-400 mb-1">System Health</p>
            <h3 className="text-4xl font-bold text-white mb-2">100%</h3>
            <p className="text-xs text-green-400">All services running</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--glass-border)] flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          <Link href="/devices" className="text-sm text-blue-400 hover:text-blue-300">View All Devices &rarr;</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-4 font-medium">Time</th>
                <th className="p-4 font-medium">Device</th>
                <th className="p-4 font-medium">Payload Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--glass-border)] text-slate-300 text-sm">
              {latestLogs.map((log) => {
                let payloadPreview = "";
                try {
                  const data = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
                  // Try to show apower active if exists
                  if (data.apower !== undefined) payloadPreview += `Power: ${data.apower}W `;
                  if (data.voltage !== undefined) payloadPreview += `Volt: ${data.voltage}V `;
                  if (!payloadPreview) payloadPreview = JSON.stringify(data).substring(0, 50);
                } catch (e) {
                  payloadPreview = "Invalid JSON";
                }

                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                    </td>
                    <td className="p-4 font-medium text-white">{log.device_id}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{payloadPreview}</td>
                  </tr>
                );
              })}
              {latestLogs.length === 0 && (
                <tr><td colSpan={3} className="p-8 text-center text-slate-500">No activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
