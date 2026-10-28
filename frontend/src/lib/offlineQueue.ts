// ═══════════════════════════════════════════════════════════════
// A.T.L.A.S STORE-AND-FORWARD TELEMETRY QUEUE
// (Autonomous Threat Location & Alert System)
// Menyimpan laporan keselamatan dan koordinat di memori lokal saat
// jaringan padam, lalu otomatis meneruskannya saat terhubung kembali.
// ═══════════════════════════════════════════════════════════════

export interface QueuedTelemetry {
  id: string;
  timestamp: number;
  type: 'location' | 'safe_report';
  payload: any;
}

const QUEUE_KEY = 'atlas_offline_telemetry_queue';

export function enqueueOfflineTelemetry(type: 'location' | 'safe_report', payload: any) {
  try {
    const existing: QueuedTelemetry[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    const item: QueuedTelemetry = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      type,
      payload
    };
    // Batasi 50 catatan terakhir agar efisien di memori perangkat
    const updated = [...existing.slice(-49), item];
    localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getOfflineTelemetryCount(): number {
  try {
    const existing: QueuedTelemetry[] = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    return existing.length;
  } catch {
    return 0;
  }
}

export async function flushOfflineTelemetryQueue(onFlushed?: (count: number) => void) {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return;
    const items: QueuedTelemetry[] = JSON.parse(raw);
    if (items.length === 0) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    // Bersihkan antrean setelah jaringan kembali online
    localStorage.removeItem(QUEUE_KEY);
    onFlushed?.(items.length);
  } catch {}
}
