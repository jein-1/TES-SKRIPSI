// ═══════════════════════════════════════════════════════════════
// useAegisSync — Real-time sync hook via Supabase
// Connects to Postgres & Realtime broadcast channels
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

export type SyncEventHandler = (event: AegisSyncEvent) => void;

export interface AegisSyncEvent {
  type:
    | "INIT"
    | "TSUNAMI"
    | "FAMILY_JOIN"
    | "PING"
    | "PING_REPLY"
    | "LOCATION_UPDATE";
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
  [key: string]: unknown;
}

// ── API helpers ───────────────────────────────────────────────
async function apiPost(path: string, body: object, isAdmin = false) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (isAdmin) {
      // Admin key disimpan di sessionStorage setelah login
      const key = sessionStorage.getItem("aegisAdminKey") ?? "aegis2024";
      headers["X-Admin-Key"] = key;
    }
    // Fetch directly from serverless function
    await fetch(path, {
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
  /** Admin: activate or deactivate tsunami alert via serverless (triggers Web Push) */
  setTsunami: (active: boolean) => apiPost("/api/tsunami", { active }, true),

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
  getTsunami: async (): Promise<{ active: boolean; ts: number }> => {
    try {
      const { data, error } = await supabase
        .from("tsunami_state")
        .select("active, updated_at")
        .eq("id", 1)
        .single();
      
      if (error || !data) return { active: false, ts: 0 };
      
      return { 
        active: data.active, 
        ts: new Date(data.updated_at).getTime() 
      };
    } catch {
      return { active: false, ts: 0 };
    }
  },
};

// ── Main hook ─────────────────────────────────────────────────
export function useAegisSync(onEvent: SyncEventHandler) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    // 1. Subscribe to Tsunami State changes (Postgres CDC)
    const tsunamiChannel = supabase
      .channel("public:tsunami_state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tsunami_state" },
        (payload) => {
          const newDoc = payload.new;
          handlerRef.current({
            type: "TSUNAMI",
            active: newDoc.active,
            ts: new Date(newDoc.updated_at).getTime(),
          });
        }
      )
      .subscribe();

    // 2. Subscribe to Ephemeral Broadcasts (Ping, Location, Family)
    broadcastChannel
      .on("broadcast", { event: "FAMILY_JOIN" }, (payload) => {
        handlerRef.current({ type: "FAMILY_JOIN", ...payload.payload });
      })
      .on("broadcast", { event: "PING" }, (payload) => {
        handlerRef.current({ type: "PING", ...payload.payload });
      })
      .on("broadcast", { event: "PING_REPLY" }, (payload) => {
        handlerRef.current({ type: "PING_REPLY", ...payload.payload });
      })
      .on("broadcast", { event: "LOCATION_UPDATE" }, (payload) => {
        handlerRef.current({ type: "LOCATION_UPDATE", ...payload.payload });
      })
      .subscribe();

    // Fire INIT event with current state
    aegisApi.getTsunami().then((state) => {
      handlerRef.current({
        type: "INIT",
        tsunami: state,
      });
    });

    return () => {
      tsunamiChannel.unsubscribe();
      // Only unsubscribe if unmounting completely. Since multiple components 
      // might use broadcastChannel, we don't destroy it here.
    };
  }, []);
}
