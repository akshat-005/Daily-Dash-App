-- Add columns to tasks table for longer tasks feature
-- Run this in your Supabase SQL Editor

ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_longer_task BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS long_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for longer task queries
CREATE INDEX IF NOT EXISTS idx_tasks_longer ON tasks(user_id, is_longer_task) WHERE is_longer_task = TRUE;
CREATE INDEX IF NOT EXISTS idx_tasks_linked ON tasks(long_task_id) WHERE long_task_id IS NOT NULL;

-- Update deadline column to support date strings for longer tasks
-- (keeping TIME for daily tasks, but longer tasks will use TEXT format)
