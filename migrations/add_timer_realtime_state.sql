-- Migration: Add real-time timer state tracking
-- Run this in your Supabase SQL Editor

-- Add columns for real-time timer state
ALTER TABLE timer_sessions
ADD COLUMN IF NOT EXISTS timer_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;

-- Add index for faster queries on active sessions
CREATE INDEX IF NOT EXISTS idx_timer_sessions_active 
ON timer_sessions(task_id, is_active) 
WHERE is_active = true;

-- Add index for user's active sessions
CREATE INDEX IF NOT EXISTS idx_timer_sessions_user_active
ON timer_sessions(user_id, is_active)
WHERE is_active = true;

-- Enable realtime for timer_sessions table
-- This allows clients to subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE timer_sessions;

-- Add comment for documentation
COMMENT ON COLUMN timer_sessions.timer_duration_seconds IS 'Initial timer duration in seconds for countdown timers';
COMMENT ON COLUMN timer_sessions.is_paused IS 'Whether the timer is currently paused';
COMMENT ON COLUMN timer_sessions.paused_at IS 'Timestamp when the timer was paused';
