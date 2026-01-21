"use client";

import { useState } from 'react';
import { Settings, Save, X, GripVertical, Check } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import clsx from 'clsx';

interface DeviceDashboardProps {
    deviceId: string;
    initialConfig: string[]; // List of visible keys
    logs: any[]; // Historical data
    allKeys: string[]; // All available keys from latest JSON
}

export default function DeviceDashboard({ deviceId, initialConfig, logs, allKeys }: DeviceDashboardProps) {
    const [visibleFields, setVisibleFields] = useState<string[]>(initialConfig.length > 0 ? initialConfig : allKeys.slice(0, 3));
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Helper to get value from nested object using dot notation
    const getValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const handleSaveConfig = async () => {
        setSaving(true);
        try {
            await fetch(`http://localhost:8080/api/devices/${deviceId}/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_id: deviceId, visible_fields: visibleFields }),
            });
            setIsConfigOpen(false);
        } catch (e) {
            console.error(e);
            alert("Failed to save configuration");
        } finally {
            setSaving(false);
        }
    };

    const toggleField = (key: string) => {
        if (visibleFields.includes(key)) {
            setVisibleFields(visibleFields.filter(k => k !== key));
        } else {
            setVisibleFields([...visibleFields, key]);
        }
    };

    // Prepare chart data
    const chartData = logs.map(log => {
        let payload = {};
        try {
            payload = typeof log.payload === 'string' ? JSON.parse(log.payload) : log.payload;
        } catch (e) { }

        return {
            timestamp: new Date(log.created_at).getTime(),
            ...payload
        };
    }).reverse(); // Recharts wants ascending time usually

    const latestLog = logs[0] ? (typeof logs[0].payload === 'string' ? JSON.parse(logs[0].payload) : logs[0].payload) : {};

    return (
        <div className="relative min-h-[calc(100vh-100px)]">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">{deviceId}</h1>
                    <p className="text-slate-400">Device Dashboard</p>
                </div>
                <button
                    onClick={() => setIsConfigOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700"
                >
                    <Settings className="w-4 h-4" />
                    <span>Customize View</span>
                </button>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
                {visibleFields.map((field) => {
                    const value = getValue(latestLog, field);
                    const isNumber = typeof value === 'number';

                    return (
                        <div key={field} className="glass-panel p-6 rounded-2xl flex flex-col h-80">
                            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">{field}</h3>
                            <div className="flex items-end space-x-2 mb-6">
                                <span className="text-4xl font-bold text-white">
                                    {value !== undefined ? (isNumber ? value.toFixed(2) : value) : "N/A"}
                                </span>
                                {/* Unit guessing could go here */}
                            </div>

                            {/* Chart for numeric values */}
                            {isNumber && (
                                <div className="flex-1 w-full min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                            <XAxis
                                                dataKey="timestamp"
                                                tickFormatter={(unix) => new Date(unix).toLocaleTimeString()}
                                                hide
                                            />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                stroke="rgba(255,255,255,0.3)"
                                                tick={{ fontSize: 12 }}
                                                width={40}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                labelFormatter={(t) => new Date(t).toLocaleString()}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey={field}
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    );
                })}
                {visibleFields.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl text-slate-500">
                        <p>No fields selected.</p>
                        <button onClick={() => setIsConfigOpen(true)} className="text-blue-400 hover:underline mt-2">Open Configuration</button>
                    </div>
                )}
            </div>

            {/* Configuration Sidebar / Drawer */}
            <div className={clsx(
                "fixed top-0 right-0 h-full w-96 bg-[#0f172a] border-l border-[var(--glass-border)] transform transition-transform duration-300 z-50 shadow-2xl p-6 overflow-y-auto",
                isConfigOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Dashboard Layout</h2>
                    <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-8">
                    <p className="text-sm text-slate-400 mb-4">Select fields to display on the dashboard.</p>
                    <div className="space-y-2">
                        {allKeys.length === 0 ? (
                            <div className="text-center p-4 text-slate-500 bg-slate-900 rounded-lg border border-slate-800 border-dashed">
                                <p className="text-sm">Waiting for data...</p>
                                <span className="text-xs">Send a JSON message to see fields.</span>
                            </div>
                        ) : (
                            allKeys.map(key => (
                                <div
                                    key={key}
                                    onClick={() => toggleField(key)}
                                    className={clsx(
                                        "flex items-center p-3 rounded-lg border cursor-pointer transition-all select-none",
                                        visibleFields.includes(key)
                                            ? "bg-blue-600/20 border-blue-500/50 text-white"
                                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors",
                                        visibleFields.includes(key) ? "bg-blue-500 border-blue-500" : "border-slate-600"
                                    )}>
                                        {visibleFields.includes(key) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span>{key}</span>
                                </div>
                            )))}
                    </div>
                </div>

                <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center space-x-2"
                >
                    {saving ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Save className="w-4 h-4" />}
                    <span>Save Configuration</span>
                </button>
            </div>

            {/* Overlay */}
            {isConfigOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    onClick={() => setIsConfigOpen(false)}
                />
            )}
        </div>
    );
}
