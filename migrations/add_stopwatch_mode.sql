-- Migration: Add stopwatch mode support for timer sessions
-- Run this in your Supabase SQL Editor

-- Add columns for stopwatch mode tracking
ALTER TABLE timer_sessions
ADD COLUMN IF NOT EXISTS is_stopwatch BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stopwatch_started_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN timer_sessions.is_stopwatch IS 'Whether this session is in stopwatch mode (counting up after timer completion)';
COMMENT ON COLUMN timer_sessions.stopwatch_started_at IS 'Timestamp when stopwatch mode started (after timer completion)';
