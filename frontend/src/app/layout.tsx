import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
    title: "IoT Dashboard",
    description: "Real-time IoT Monitoring",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                <Sidebar />
                <main className="ml-64 p-8 min-h-screen transition-all duration-300">
                    {children}
                </main>
            </body>
        </html>
    );
}
