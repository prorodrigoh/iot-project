import { pool } from '@/lib/db';
import DeviceDashboard from '@/components/DeviceDashboard';
import { redirect } from 'next/navigation';

export const revalidate = 0; // Always fresh data for this one? Or allow 5s.

// Helper to flatten JSON keys
function flattenKeys(obj: any, prefix = ''): string[] {
    if (!obj || typeof obj !== 'object') return [];

    return Object.keys(obj).reduce((acc: string[], key: string) => {
        const pre = prefix.length ? prefix + '.' : '';
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            acc.push(...flattenKeys(obj[key], pre + key));
        } else {
            acc.push(pre + key);
        }
        return acc;
    }, []);
}

async function getDeviceData(id: string) {
    // 1. Get logs
    const [logs] = await pool.query('SELECT * FROM power_logs WHERE device_id = ? ORDER BY created_at DESC LIMIT 50', [id]);

    // 2. Get Config
    const [configRows] = await pool.query('SELECT visible_fields FROM dashboard_configs WHERE device_id = ?', [id]);
    const config = (configRows as any[])[0]?.visible_fields || [];

    // 3. Get Keys (from latest log)
    let allKeys: string[] = [];
    if ((logs as any[]).length > 0) {
        try {
            const latest = (logs as any[])[0];
            const payload = typeof latest.payload === 'string' ? JSON.parse(latest.payload) : latest.payload;
            allKeys = flattenKeys(payload);
        } catch (e) { }
    }

    return { logs: logs as any[], config: typeof config === 'string' ? JSON.parse(config) : config, allKeys };
}

export default async function DevicePage({ params }: { params: { id: string } }) {
    const { id } = await params; // Next.js 15+ params are promises? Or standard. Safe to await.
    const { logs, config, allKeys } = await getDeviceData(id);

    if (logs.length === 0 && allKeys.length === 0) {
        // Optional: Handle "Device Found but no logs yet" vs "Unknown Device"
        // For now just render empty
    }

    return (
        <DeviceDashboard
            deviceId={id}
            initialConfig={config}
            logs={logs}
            allKeys={allKeys}
        />
    );
}
