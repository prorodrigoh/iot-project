"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

export default function SettingsPage() {
    const [detectedIp, setDetectedIp] = useState("");
    const [overrideIp, setOverrideIp] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        fetchSystemInfo();
    }, []);

    const fetchSystemInfo = async () => {
        setLoading(true);
        try {
            const res = await fetch("http://localhost:8080/api/system-info");
            if (res.ok) {
                const data = await res.json();
                setDetectedIp(data.detected);
                setOverrideIp(data.override || "");
            }
        } catch (err) {
            console.error("Failed to fetch system info", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatus(null);
        try {
            const res = await fetch("http://localhost:8080/api/system-info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ip: overrideIp }),
            });

            if (res.ok) {
                setStatus({ type: 'success', message: "Settings saved successfully!" });
            } else {
                throw new Error("Failed to save settings");
            }
        } catch (err) {
            setStatus({ type: 'error', message: "Error saving settings. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
                <p className="text-slate-400">Configure global dashboard preferences</p>
            </div>

            <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="relative z-10 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center space-x-2 text-white font-semibold">
                            <Settings className="w-5 h-5 text-blue-400" />
                            <h2>MQTT Broker Configuration</h2>
                        </div>

                        <div className="space-y-6 bg-slate-900/40 p-6 rounded-xl border border-slate-800/50">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Detected Host IP</label>
                                <div className="flex items-center space-x-3">
                                    <code className="bg-slate-800 text-blue-300 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-sm">
                                        {loading ? "Detecting..." : detectedIp || "Unknown"}
                                    </code>
                                    <span className="text-xs text-slate-500 italic">(Autodetected LAN IP)</span>
                                </div>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Broker IP Override</label>
                                    <input
                                        type="text"
                                        value={overrideIp}
                                        onChange={(e) => setOverrideIp(e.target.value)}
                                        placeholder={detectedIp || "e.g. 192.168.1.50"}
                                        className="w-full bg-slate-900/80 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                                    />
                                    <p className="text-xs text-slate-500 mt-2 italic">
                                        Leave empty to use autodetected IP. This IP will be sent to Shelly devices during "Config & Scan".
                                    </p>
                                </div>

                                {status && (
                                    <div className={clsx(
                                        "flex items-center space-x-2 p-4 rounded-xl text-sm animate-in zoom-in-95 duration-200",
                                        status.type === 'success' ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                    )}>
                                        {status.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        <span>{status.message}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center justify-center space-x-2 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>{saving ? "Saving..." : "Save Configuration"}</span>
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
