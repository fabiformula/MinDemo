-- Create active_patterns table for Discovery Mode
CREATE TABLE IF NOT EXISTS active_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  heart_rate NUMERIC,
  breath_rate NUMERIC,
  variability NUMERIC,
  location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

-- Index for cleanup and querying
CREATE INDEX IF NOT EXISTS idx_active_patterns_expires ON active_patterns(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_patterns_user ON active_patterns(user_id);

-- Enable RLS
ALTER TABLE active_patterns ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read active patterns (to show on map)
CREATE POLICY "Enable read access for all users" ON active_patterns
  FOR SELECT USING (true);

-- Users can insert their own pattern
CREATE POLICY "Enable insert for authenticated users only" ON active_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own pattern
CREATE POLICY "Enable update for users based on user_id" ON active_patterns
  FOR UPDATE USING (auth.uid() = user_id);
