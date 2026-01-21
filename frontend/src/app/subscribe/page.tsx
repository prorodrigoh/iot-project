"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Tag, Terminal, Wifi, Settings, Clock } from "lucide-react";
import clsx from 'clsx';

export default function SubscribePage() {
    const [mode, setMode] = useState<'manual' | 'scan'>('manual');
    const [topic, setTopic] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [interval, setIntervalValue] = useState(30);

    // Unified Device IP State
    const [deviceIp, setDeviceIp] = useState('');
    const [scanning, setScanning] = useState(false);
    const [scanResults, setScanResults] = useState<{ topic_prefix: string, suggestions: string[] } | null>(null);

    // Manual Config State
    const [showConfig, setShowConfig] = useState(false);

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [rebooting, setRebooting] = useState(false);
    const [brokerIp, setBrokerIp] = useState("");

    useEffect(() => {
        fetch("http://localhost:8080/api/system-info")
            .then(res => res.json())
            .then(data => {
                const ip = data.override || data.detected;
                setBrokerIp(ip);
                setDeviceIp(ip);
            })
            .catch(console.error);
    }, []);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        setScanning(true);
        setScanResults(null);
        try {
            // 1. Auto-Configure Device (RPC)
            const configRes = await fetch('http://localhost:8080/api/configure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_ip: deviceIp, interval: Number(interval) }),
            });

            if (configRes.ok) {
                console.log("Device configured successfully. Rebooting...");
                setRebooting(true);
                // Wait for reboot
                await new Promise(r => setTimeout(r, 5000));
                setRebooting(false);
            } else {
                console.warn("Auto-config failed, proceeding to scan anyway...");
            }

            // 2. Discover Topics
            await new Promise(r => setTimeout(r, 1500));

            const res = await fetch(`http://localhost:8080/api/discover?ip=${deviceIp}`);
            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || 'Scan failed');
            }
            const data = await res.json();
            setScanResults(data);
            if (data.device_name) {
                setDeviceName(data.device_name);
            }
        } catch (err: any) {
            alert(`Scan Error: ${err.message}\nEnsure device is reachable.`);
        } finally {
            setScanning(false);
        }
    };

    const selectSuggestion = (t: string) => {
        setTopic(t);
        const parts = t.split('/');
        setDeviceName(parts[0] || "New Device");
        setMode('manual');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Optional: Configure device if IP provided in Manual Entry
            if (showConfig && deviceIp) {
                const configRes = await fetch('http://localhost:8080/api/configure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device_ip: deviceIp, interval: Number(interval) }),
                });

                if (configRes.ok) {
                    setRebooting(true);
                    await new Promise(r => setTimeout(r, 5000));
                    setRebooting(false);
                }
            }

            const res = await fetch('http://localhost:8080/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    device_name: deviceName,
                    device_ip: deviceIp
                }),
            });

            if (!res.ok) throw new Error('Failed to subscribe');

            const data = await res.json();
            const deviceId = data.device_id;

            // Clear cache and navigate to the devices list
            router.refresh();
            router.push('/devices');
        } catch (error) {
            alert('Error processing subscription');
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
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex space-x-4">
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

                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Broker: {brokerIp || "Detecting..."}</span>
                    </div>
                </div>

                {mode === 'scan' ? (
                    <div className="relative z-10 space-y-6">
                        <form onSubmit={handleScan} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Device IP Address</label>
                                <input
                                    type="text"
                                    value={deviceIp}
                                    onChange={(e) => setDeviceIp(e.target.value)}
                                    placeholder="e.g. 192.168.1.100"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                                    <Clock className="w-4 h-4 mr-1 text-slate-500" />
                                    Reporting Interval (seconds)
                                </label>
                                <input
                                    type="number"
                                    value={interval}
                                    onChange={(e) => setIntervalValue(Number(e.target.value))}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                    min="1"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={scanning}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {rebooting ? "Rebooting (5s)..." : scanning ? "Configuring & Scanning..." : "Enable MQTT & Scan"}
                            </button>
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                Will enable MQTT, RPC notifications, and status updates on the device.
                            </p>
                        </form>

                        {scanResults && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 p-4 bg-slate-900/40 rounded-xl border border-slate-800">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">MQTT Topic</label>
                                <div className="relative group">
                                    <Terminal className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="e.g. shellyplus1pm/events/rpc"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Device Name / ID</label>
                                <div className="relative group">
                                    <Tag className="absolute left-3 top-3 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                                    <input
                                        type="text"
                                        value={deviceName}
                                        onChange={(e) => setDeviceName(e.target.value)}
                                        placeholder="e.g. Kitchen Light"
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-slate-600"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Settings className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-300">Device Configuration</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showConfig}
                                        onChange={() => setShowConfig(!showConfig)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            {showConfig && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Device IP (to apply settings)</label>
                                        <input
                                            type="text"
                                            value={deviceIp}
                                            onChange={(e) => setDeviceIp(e.target.value)}
                                            placeholder="192.168.1.100"
                                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center">
                                            Reporting Interval (seconds)
                                        </label>
                                        <input
                                            type="number"
                                            value={interval}
                                            onChange={(e) => setIntervalValue(Number(e.target.value))}
                                            className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-2 px-4 text-white text-sm focus:outline-none focus:border-blue-500 transition-all"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || rebooting}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center space-x-2"
                        >
                            {rebooting ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Rebooting (5s)...</span>
                                </div>
                            ) : loading ? (
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
