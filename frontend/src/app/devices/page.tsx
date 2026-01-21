import { pool } from '@/lib/db';
import Link from 'next/link';
import { Server, Activity, ArrowRight } from "lucide-react";

export const revalidate = 5;

async function getDevices() {
    // Get distinct devices and their latest activity time
    const [rows] = await pool.query(`
    SELECT device_id, MAX(created_at) as last_seen, COUNT(*) as msg_count 
    FROM power_logs 
    GROUP BY device_id 
    ORDER BY last_seen DESC
  `);
    return rows as any[];
}

export default async function DevicesPage() {
    const devices = await getDevices();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Connected Devices</h1>
                <p className="text-slate-400">Manage and monitor specific device streams</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                    <Link
                        key={device.device_id}
                        href={`/devices/${device.device_id}`}
                        className="block group"
                    >
                        <div className="glass-panel p-6 rounded-2xl h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-blue-500/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-5 h-5 text-blue-400" />
                            </div>

                            <div className="flex items-center space-x-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <Server className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white truncate max-w-[150px]" title={device.device_id}>{device.device_id}</h3>
                                    <div className="flex items-center space-x-1 text-xs text-green-400">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        <span>Online</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Last Seen</span>
                                    <span className="text-slate-300">{new Date(device.last_seen).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Messages</span>
                                    <span className="text-slate-300">{device.msg_count}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}

                {devices.length === 0 && (
                    <div className="col-span-full p-12 text-center border border-dashed border-slate-700 rounded-2xl">
                        <Server className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-slate-400">No devices connected</h3>
                        <p className="text-slate-500 mt-2">Subscribe to a topic to start receiving data.</p>
                        <Link href="/subscribe" className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                            Add Device
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
