-- Public Rooms Table
CREATE TABLE IF NOT EXISTS public_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on active rooms
CREATE INDEX IF NOT EXISTS idx_public_rooms_active ON public_rooms(is_active, created_at DESC);

-- User Reports Table
CREATE TABLE IF NOT EXISTS user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_user_id TEXT NOT NULL,
  reported_by TEXT NOT NULL,
  reported_ip TEXT,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for counting reports
CREATE INDEX IF NOT EXISTS idx_user_reports_user_id ON user_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_ip ON user_reports(reported_ip);

-- Banned Users Table
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  ip_address TEXT,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('temporary', 'permanent')),
  banned_until TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT user_or_ip_required CHECK (user_id IS NOT NULL OR ip_address IS NOT NULL)
);

-- Create indexes for ban checks
CREATE INDEX IF NOT EXISTS idx_banned_users_user_id ON banned_users(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_banned_users_ip ON banned_users(ip_address) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_banned_users_active ON banned_users(ban_type, banned_until) WHERE ban_type = 'temporary';

-- Room Participants (for tracking who's in which room)
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public_rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Create indexes for participant queries
CREATE INDEX IF NOT EXISTS idx_room_participants_room ON room_participants(room_id, joined_at);
CREATE INDEX IF NOT EXISTS idx_room_participants_user ON room_participants(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for public_rooms
CREATE TRIGGER update_public_rooms_updated_at
  BEFORE UPDATE ON public_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old room participants
CREATE OR REPLACE FUNCTION cleanup_old_participants()
RETURNS void AS $$
BEGIN
  DELETE FROM room_participants
  WHERE last_seen < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to get report count for user/IP
CREATE OR REPLACE FUNCTION get_report_count(
  p_user_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO report_count
  FROM user_reports
  WHERE (p_user_id IS NOT NULL AND reported_user_id = p_user_id)
     OR (p_ip_address IS NOT NULL AND reported_ip = p_ip_address);
  
  RETURN report_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user/IP is banned
CREATE OR REPLACE FUNCTION is_banned(
  p_user_id TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS TABLE(
  banned BOOLEAN,
  ban_type TEXT,
  banned_until TIMESTAMP WITH TIME ZONE,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS banned,
    b.ban_type,
    b.banned_until,
    b.reason
  FROM banned_users b
  WHERE (
    (p_user_id IS NOT NULL AND b.user_id = p_user_id)
    OR (p_ip_address IS NOT NULL AND b.ip_address = p_ip_address)
  )
  AND (
    b.ban_type = 'permanent'
    OR (b.ban_type = 'temporary' AND b.banned_until > NOW())
  )
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TIMESTAMP WITH TIME ZONE, NULL::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insert some example data (optional, for testing)
-- INSERT INTO public_rooms (name, description, created_by) VALUES
--   ('General Chat', 'Open room for everyone', 'system'),
--   ('Tech Talk', 'Discuss technology and programming', 'system'),
--   ('Gaming', 'Gaming enthusiasts welcome', 'system');
