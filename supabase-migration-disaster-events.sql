-- AEGIS / ATLAS - NERVE Integration Migration
-- Tabel disaster_events untuk menampung riwayat data bencana (BMKG, USGS, JMA)
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS disaster_events (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,                     -- 'BMKG', 'USGS', 'JMA'
    type TEXT NOT NULL,                       -- 'earthquake', 'tsunami', 'typhoon'
    title TEXT,
    magnitude REAL,
    depth TEXT,
    location TEXT,
    coordinates TEXT,                         -- 'lat,lng'
    payload JSONB,                            -- raw payload JSON
    report_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing untuk pencarian cepat berdasarkan waktu, sumber, dan magnitudo
CREATE INDEX IF NOT EXISTS idx_disaster_events_datetime ON disaster_events(report_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_disaster_events_source ON disaster_events(source);
CREATE INDEX IF NOT EXISTS idx_disaster_events_magnitude ON disaster_events(magnitude DESC);

-- Enable Realtime agar aplikasi client A.T.L.A.S menerima event baru secara instan
ALTER PUBLICATION supabase_realtime ADD TABLE disaster_events;

-- Bypassing RLS sesuai standar pengembangan A.T.L.A.S
ALTER TABLE disaster_events DISABLE ROW LEVEL SECURITY;
