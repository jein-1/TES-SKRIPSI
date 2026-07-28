-- Migration: Create login_attempts table for brute-force protection
-- Run this in the Supabase SQL Editor

CREATE TABLE public.login_attempts (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    ip TEXT,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies for public or authenticated users.
-- This ensures the table is strictly accessible ONLY by the backend via the service_role key.
-- (The service_role key bypasses RLS by default).
