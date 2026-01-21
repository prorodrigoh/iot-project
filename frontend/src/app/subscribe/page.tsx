"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Radio, Tag, Terminal, Search, Wifi } from "lucide-react";
import clsx from 'clsx';

export default function SubscribePage() {
    const [mode, setMode] = useState<'manual' | 'scan'>('manual');
    const [topic, setTopic] = useState('');
    const [deviceName, setDeviceName] = useState('');

    // Scan State
    const [scanIp, setScanIp] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResults, setScanResults] = useState<{ topic_prefix: string, suggestions: string[] } | null>(null);

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        setScanning(true);
        setScanResults(null);
        try {
            // 1. Auto-Configure Device (RPC)
            // This ensures the device is actually pointing to our broker before we scan for its topics.
            const configRes = await fetch('http://localhost:8080/api/configure', {
                method: 'POST',
                body: JSON.stringify({ device_ip: scanIp }),
            });

            if (configRes.ok) {
                console.log("Device configured successfully");
            } else {
                console.warn("Auto-config failed, proceeding to scan anyway...");
            }

            // 2. Discover Topics
            // Wait a moment for device to potentially restart or reconnect MQTT
            await new Promise(r => setTimeout(r, 1500));

            const res = await fetch(`http://localhost:8080/api/discover?ip=${scanIp}`);
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Scan failed');
            }
            const data = await res.json();
            setScanResults(data);
        } catch (err: any) {
            alert(`Scan Error: ${err.message}\nEnsure device is reachable.`);
        } finally {
            setScanning(false);
        }
    };

    const selectSuggestion = (t: string) => {
        setTopic(t);
        // Auto-suggest name
        const parts = t.split('/');
        setDeviceName(parts[0] || "New Device");
        setMode('manual');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8080/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, device_name: deviceName }),
            });

            if (!res.ok) throw new Error('Failed to subscribe');

            router.push(`/devices/${deviceName}`);
            router.refresh();
        } catch (error) {
            alert('Error subscribing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">New Subscription</h1>
                <p className="text-slate-400">Listen to a new MQTT topic stream</p>
            </div>

            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                {/* Decorator */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                {/* Tabs */}
                <div className="flex space-x-4 mb-6 relative z-10">
                    <button
                        onClick={() => setMode('manual')}
                        className={clsx("flex items-center px-4 py-2 rounded-lg transition-all", mode === 'manual' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}
                    >
                        <Terminal className="w-4 h-4 mr-2" />
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setMode('scan')}
                        className={clsx("flex items-center px-4 py-2 rounded-lg transition-all", mode === 'scan' ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "bg-slate-800 text-slate-400 hover:bg-slate-700")}
                    >
                        <Wifi className="w-4 h-4 mr-2" />
                        Scan IP
                    </button>
                </div>

                {mode === 'scan' ? (
                    <div className="relative z-10 space-y-6">
                        <form onSubmit={handleScan}>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Device IP Address</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={scanIp}
                                    onChange={(e) => setScanIp(e.target.value)}
                                    placeholder="e.g. 192.168.1.100"
                                    className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={scanning}
                                    className="px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {scanning ? "Configuring..." : "Config & Scan"}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">Requires device to have standard Shelly API endpoints.</p>
                        </form>

                        {scanResults && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <h3 className="text-sm font-medium text-slate-300 mb-3">Discovered Topics</h3>
                                <div className="space-y-2">
                                    {scanResults.suggestions.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => selectSuggestion(t)}
                                            className="w-full text-left p-3 rounded-lg bg-slate-800/50 hover:bg-blue-600/20 hover:border-blue-500/50 border border-transparent transition-all flex items-center group"
                                        >
                                            <Tag className="w-4 h-4 text-slate-500 mr-2 group-hover:text-blue-400" />
                                            <span className="text-slate-300 group-hover:text-white font-mono text-sm">{t}</span>
                                            <div className="ml-auto text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Select &rarr;
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10 animate-in fade-in duration-300">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">MQTT Topic</label>
                            <div className="relative group">
                                <Terminal className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. shellyplus1pm/status/switch:0"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">The exact MQTT topic string to subscribe to.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Device Name / ID</label>
                            <div className="relative group">
                                <Tag className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                <input
                                    type="text"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    placeholder="e.g. Living Room Switch"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <PlusCircle className="w-5 h-5" />
                                    <span>Start Listening</span>
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
