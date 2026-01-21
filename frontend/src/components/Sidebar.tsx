"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Server, Radio, PlusCircle, Settings } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { name: "Global Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Connected Devices", href: "/devices", icon: Server },
    { name: "Subscribe Topic", href: "/subscribe", icon: PlusCircle },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-screen w-64 glass-sidebar fixed left-0 top-0 z-20 transition-all duration-300">
            <div className="p-6 border-b border-[var(--glass-border)]">
                <div className="flex items-center space-x-2">
                    <Radio className="w-8 h-8 text-blue-500" />
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                        IoT Monitor
                    </h1>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            )}
                        >
                            <Icon className={clsx("w-5 h-5", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[var(--glass-border)]">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-1">System Status</p>
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm text-slate-300">Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
