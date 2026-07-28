-- Migration: Refactor Hazard Zone severity to ZRB Level
-- Run this in the Supabase SQL Editor

-- 1. Add new column zrb_level
ALTER TABLE public.hazard_zones ADD COLUMN zrb_level INT CHECK (zrb_level BETWEEN 1 AND 4);

-- 2. Migrate existing severity data to zrb_level
-- 'tinggi' => 4 (ZONA TERLARANG)
-- 'sedang' => 3 (ZONA TERBATAS)
-- 'rendah' => 1 (ZONA PENGEMBANGAN)
UPDATE public.hazard_zones SET zrb_level = 4 WHERE severity = 'tinggi';
UPDATE public.hazard_zones SET zrb_level = 3 WHERE severity = 'sedang';
UPDATE public.hazard_zones SET zrb_level = 1 WHERE severity = 'rendah';

-- Default fallback if any exist without mapping
UPDATE public.hazard_zones SET zrb_level = 4 WHERE zrb_level IS NULL;

-- 3. Make zrb_level NOT NULL
ALTER TABLE public.hazard_zones ALTER COLUMN zrb_level SET NOT NULL;

-- 4. Drop old severity column
ALTER TABLE public.hazard_zones DROP COLUMN severity;
