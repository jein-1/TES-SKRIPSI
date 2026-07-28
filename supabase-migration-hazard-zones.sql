-- Create hazard_zones table
CREATE TABLE public.hazard_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    coordinates JSONB NOT NULL,
    severity TEXT DEFAULT 'tinggi',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hazard_zones ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT is public
CREATE POLICY "allow_select" ON public.hazard_zones FOR SELECT USING (true);

-- Policy: INSERT/UPDATE/DELETE blocked from client
CREATE POLICY "block_insert" ON public.hazard_zones FOR INSERT WITH CHECK (false);
CREATE POLICY "block_update" ON public.hazard_zones FOR UPDATE USING (false);
CREATE POLICY "block_delete" ON public.hazard_zones FOR DELETE USING (false);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.hazard_zones;

-- Insert initial hardcoded zones
INSERT INTO public.hazard_zones (id, name, coordinates, severity) VALUES
('HZ1', 'Zona Pesisir Barat (Kecamatan Ulujadi & Lere)', '[[ -0.87, 119.83 ], [ -0.875, 119.833 ], [ -0.88, 119.836 ], [ -0.884, 119.839 ], [ -0.888, 119.843 ], [ -0.891, 119.845 ], [ -0.892, 119.846 ], [ -0.893, 119.844 ], [ -0.89, 119.841 ], [ -0.886, 119.837 ], [ -0.881, 119.834 ], [ -0.876, 119.831 ], [ -0.87, 119.828 ]]'::jsonb, 'tinggi'),
('HZ2', 'Zona Pesisir Timur (Besusu & Talise)', '[[ -0.885, 119.845 ], [ -0.887, 119.848 ], [ -0.889, 119.851 ], [ -0.891, 119.855 ], [ -0.893, 119.858 ], [ -0.895, 119.861 ], [ -0.897, 119.863 ], [ -0.896, 119.865 ], [ -0.893, 119.86 ], [ -0.89, 119.855 ], [ -0.888, 119.85 ], [ -0.885, 119.847 ]]'::jsonb, 'tinggi');
