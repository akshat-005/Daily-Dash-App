-- Revisits Table Migration
-- Spaced repetition system for learning materials

-- Create revisits table
CREATE TABLE IF NOT EXISTS revisits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Core fields
  title TEXT NOT NULL,                    -- "MCP Servers"
  type TEXT DEFAULT 'misc' CHECK (type IN ('tech', 'leetcode', 'math', 'college', 'book', 'misc')),
  resource_url TEXT,                      -- Optional link to YouTube/blog/GitHub
  reason_to_return TEXT,                  -- "Why am I saving this?" - KEY field
  notes TEXT,                             -- Optional notes (what confused me / key takeaway)
  
  -- Time management
  estimated_time_min INTEGER DEFAULT 15 CHECK (estimated_time_min IN (5, 15, 30, 60)),
  
  -- Spaced repetition fields
  difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  review_count INTEGER DEFAULT 0,         -- How many times reviewed
  
  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'done', 'archived')),
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at DATE NOT NULL,           -- When to revisit
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_revisits_user_status ON revisits(user_id, status);
CREATE INDEX IF NOT EXISTS idx_revisits_user_next_review ON revisits(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_revisits_next_review_at ON revisits(next_review_at);

-- Enable Row Level Security
ALTER TABLE revisits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own revisits"
  ON revisits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own revisits"
  ON revisits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own revisits"
  ON revisits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own revisits"
  ON revisits FOR DELETE
  USING (auth.uid() = user_id);

-- Update trigger (uses existing function)
CREATE TRIGGER update_revisits_updated_at BEFORE UPDATE ON revisits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
