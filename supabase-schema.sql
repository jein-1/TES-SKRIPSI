-- AEGIS RESPONSE - Supabase Schema
-- -------------------------------------------------------------

-- 1. Tabel untuk Tsunami State
CREATE TABLE tsunami_state (
    id INT PRIMARY KEY,
    active BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inisialisasi state awal
INSERT INTO tsunami_state (id, active) VALUES (1, false);

-- Enable Realtime untuk tsunami_state
ALTER PUBLICATION supabase_realtime ADD TABLE tsunami_state;

-- 2. Tabel untuk Web Push Subscriptions
CREATE TABLE push_subscriptions (
    endpoint TEXT PRIMARY KEY,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel untuk Location Updates (Tracking)
CREATE TABLE location_updates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    device_model TEXT,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    battery INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime untuk location_updates
ALTER PUBLICATION supabase_realtime ADD TABLE location_updates;

-- -------------------------------------------------------------
-- Bypassing RLS for server/anon access 
-- (Untuk kemudahan skripsi, RLS dimatikan. Di production asli, nyalakan RLS)
ALTER TABLE tsunami_state DISABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE location_updates DISABLE ROW LEVEL SECURITY;
