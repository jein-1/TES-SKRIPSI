// ═══════════════════════════════════════════════════════════════
// useAegisSync — Real-time sync hook via Supabase
// Connects to Postgres & Realtime broadcast channels
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import type { Shelter } from "./evacuation/types";

export type SyncEventHandler = (event: AegisSyncEvent) => void;

export interface AegisSyncEvent {
  type:
    | "INIT"
    | "TSUNAMI"
    | "FAMILY_JOIN"
    | "PING"
    | "PING_REPLY"
    | "LOCATION_UPDATE"
    | "SHELTER_ADDED";
  fromId?: string;
  fromName?: string;
  toId?: string;
  role?: string;
  id?: string;
  name?: string;
  deviceModel?: string;
  lat?: number;
  lng?: number;
  battery?: number;
  active?: boolean;
  ts?: number;
  shelter?: Shelter;
  [key: string]: unknown;
}

// ── API helpers ───────────────────────────────────────────────
async function apiPost(path: string, body: object, isAdmin = false) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isAdmin) {
      const token = sessionStorage.getItem("aegisJWT");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        console.warn("[AegisSync] Warning: isAdmin is true but aegisJWT is missing.");
      }
    }
    // Handle Capacitor environments by prepending Vercel URL if missing
    const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes('localhost');
    const baseUrl = isLocalhost ? (import.meta.env.VITE_API_URL || "https://tsunami-dimss.vercel.app") : "";
    const fullUrl = path.startsWith("/") ? `${baseUrl}${path}` : path;

    await fetch(fullUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn("[AegisSync] POST failed:", path, err);
  }
}

// Broadcast channel for ephemeral events
const broadcastChannel = supabase.channel("aegis-events");

export const aegisApi = {
  /** Admin: activate or deactivate tsunami alert via serverless (triggers Web Push) and broadcast immediately */
  setTsunami: async (active: boolean) => {
    // 1. Broadcast immediately for fast admin-user sync
    await broadcastChannel.send({
      type: "broadcast",
      event: "TSUNAMI",
      payload: { active, ts: Date.now() },
    });
    
    // 2. Persist to Postgres directly to ensure state is saved reliably
    await supabase.from("tsunami_state").update({ active, updated_at: new Date().toISOString() }).eq("id", 1);
    
    // 3. Persist to API (for Web Push triggers)
    return apiPost("/api/tsunami", { active }, true);
  },

  /** When A scans B's QR, notify B so it adds A (Supabase Broadcast) */
  notifyFamilyJoin: async (fromId: string, fromName: string, toId: string) => {
    await broadcastChannel.send({
      type: "broadcast",
      event: "FAMILY_JOIN",
      payload: { fromId, fromName, toId },
    });
  },

  /** Ping a specific device (or all if toId is missing) (Supabase Broadcast) */
  ping: async (fromId: string, fromName: string, toId?: string, role?: string) => {
    await broadcastChannel.send({
      type: "broadcast",
      event: "PING",
      payload: { fromId, fromName, toId, role },
    });
  },

  adminPing: async (fromId: string, fromName: string, toId: string, role: string) => {
    await broadcastChannel.send({
      type: "broadcast",
      event: "PING",
      payload: { fromId, fromName, toId, role }, // using broadcast since serverless is slow
    });
  },

  /** Reply to a ping (Supabase Broadcast) */
  pingReply: async (fromId: string, fromName: string, toId: string) => {
    await broadcastChannel.send({
      type: "broadcast",
      event: "PING_REPLY",
      payload: { fromId, fromName, toId },
    });
  },

  /** Broadcast user location (Supabase Upsert & Broadcast) */
  broadcastLocation: async (id: string, name: string, deviceModel: string, lat: number, lng: number, battery: number) => {
    // 1. Broadcast immediately for fast admin dashboard update
    await broadcastChannel.send({
      type: "broadcast",
      event: "LOCATION_UPDATE",
      payload: { id, name, deviceModel, lat, lng, battery },
    });
    
    // 2. Persist to Postgres for audit trail
    await supabase.from("location_updates").upsert({
      id,
      name,
      device_model: deviceModel,
      lat,
      lng,
      battery,
      updated_at: new Date().toISOString()
    });
  },

  /** Get current tsunami state on mount */
  getTsunami: async (): Promise<{ active: boolean; ts: number; ok: boolean }> => {
    try {
      const { data, error } = await supabase
        .from("tsunami_state")
        .select("active, updated_at")
        .eq("id", 1)
        .single();
      
      if (error || !data) return { active: false, ts: 0, ok: false };
      
      return { 
        active: data.active, 
        ts: new Date(data.updated_at).getTime(),
        ok: true
      };
    } catch {
      return { active: false, ts: 0, ok: false };
    }
  },

  // ── Custom Shelter API ─────────────────────────────────────

  /** Admin: simpan shelter custom ke Supabase + broadcast ke semua device */
  addCustomShelter: async (shelter: Shelter): Promise<{ ok: boolean }> => {
    try {
      const token = sessionStorage.getItem("aegisJWT");
      if (!token) return { ok: false };

      const isLocalhost = typeof window !== 'undefined' && window.location.origin.includes('localhost');
      const API_URL = isLocalhost ? (import.meta.env.VITE_API_URL || "https://tsunami-dimss.vercel.app") : "";
      const res = await fetch(`${API_URL}/api/shelters/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: shelter.id,
          name: shelter.name,
          lat: shelter.lat,
          lng: shelter.lng,
          capacity: shelter.capacity,
          radiusMeters: shelter.radiusMeters ?? 50
        }),
      });

      if (!res.ok) {
        console.error("[AegisSync] addCustomShelter error:", await res.text());
        return { ok: false };
      }
      // Broadcast ke semua device agar langsung muncul tanpa refresh
      await broadcastChannel.send({
        type: "broadcast",
        event: "SHELTER_ADDED",
        payload: { shelter },
      });
      return { ok: true };
    } catch (e) {
      console.error("[AegisSync] addCustomShelter exception:", e);
      return { ok: false };
    }
  },

  /** Semua device: ambil semua custom shelter dari Supabase saat load */
  fetchCustomShelters: async (): Promise<Shelter[]> => {
    try {
      const { data, error } = await supabase
        .from("custom_shelters")
        .select("id, name, lat, lng, capacity, radius_meters")
        .order("created_at", { ascending: true });
      if (error || !data) return [];
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        capacity: row.capacity,
        radiusMeters: row.radius_meters,
      }));
    } catch {
      return [];
    }
  },

  /** Admin: Ambil lokasi aktif 2 jam terakhir dari Supabase saat load awal */
  fetchActiveUsers: async () => {
    try {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("location_updates")
        .select("id, name, device_model, lat, lng, battery, updated_at")
        .gte("updated_at", twoHoursAgo);
      if (error || !data) return [];
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        deviceModel: row.device_model,
        lat: row.lat,
        lng: row.lng,
        battery: row.battery,
        ts: new Date(row.updated_at).getTime(),
      }));
    } catch {
      return [];
    }
  },
};

// ── Global Listener Registry ────────────────────────────────────
const listeners = new Set<SyncEventHandler>();

// Subscribe ONCE at the module level
const tsunamiChannel = supabase
  .channel("public:tsunami_state")
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "tsunami_state" },
    (payload) => {
      const newDoc = payload.new;
      listeners.forEach((fn) =>
        fn({
          type: "TSUNAMI",
          active: newDoc.active,
          ts: new Date(newDoc.updated_at).getTime(),
        })
      );
    }
  )
  .subscribe();

// Realtime listener untuk INSERT ke custom_shelters
const customSheltersChannel = supabase
  .channel("public:custom_shelters")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "custom_shelters" },
    (payload) => {
      const row = payload.new;
      const shelter: Shelter = {
        id: row.id,
        name: row.name,
        lat: row.lat,
        lng: row.lng,
        capacity: row.capacity,
        radiusMeters: row.radius_meters,
      };
      listeners.forEach((fn) => fn({ type: "SHELTER_ADDED", shelter }));
    }
  )
  .subscribe();

broadcastChannel
  .on("broadcast", { event: "FAMILY_JOIN" }, (payload) => {
    listeners.forEach((fn) => fn({ type: "FAMILY_JOIN", ...payload.payload }));
  })
  .on("broadcast", { event: "PING" }, (payload) => {
    listeners.forEach((fn) => fn({ type: "PING", ...payload.payload }));
  })
  .on("broadcast", { event: "PING_REPLY" }, (payload) => {
    listeners.forEach((fn) => fn({ type: "PING_REPLY", ...payload.payload }));
  })
  .on("broadcast", { event: "LOCATION_UPDATE" }, (payload) => {
    listeners.forEach((fn) => fn({ type: "LOCATION_UPDATE", ...payload.payload }));
  })
  .on("broadcast", { event: "TSUNAMI" }, (payload) => {
    listeners.forEach((fn) => fn({ type: "TSUNAMI", ...payload.payload }));
  })
  .on("broadcast", { event: "SHELTER_ADDED" }, (payload) => {
    listeners.forEach((fn) => fn({ type: "SHELTER_ADDED", ...payload.payload }));
  })
  .subscribe();

// ── Main hook ─────────────────────────────────────────────────
export function useAegisSync(onEvent: SyncEventHandler) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const handler = (e: any) => {
      handlerRef.current(e);
    };

    listeners.add(handler);

    // Fire INIT event with current state
    aegisApi.getTsunami().then((state) => {
      handlerRef.current({
        type: "INIT",
        tsunami: state,
      });
    });

    return () => {
      listeners.delete(handler);
    };
  }, []);
}
