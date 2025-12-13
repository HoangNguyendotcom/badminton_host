-- Badminton Team Splitter - Database Schema
-- Run this in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE game_mode AS ENUM ('team', 'free_play', 'tournament');
CREATE TYPE tournament_format AS ENUM ('round_robin', 'single_elimination', 'double_elimination');
CREATE TYPE match_type AS ENUM ('singles', 'doubles', 'mixed_doubles');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE match_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE match_side AS ENUM ('a', 'b');
CREATE TYPE bracket_type AS ENUM ('winners', 'losers');
CREATE TYPE participant_type AS ENUM ('player', 'pair');

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(6) UNIQUE NOT NULL,
  game_mode game_mode NOT NULL DEFAULT 'team',
  tournament_format tournament_format,
  match_type_default match_type,
  skill_diff_threshold INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on session code for fast lookups
CREATE INDEX idx_sessions_code ON sessions(code);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  gender gender NOT NULL,
  skill_level INTEGER NOT NULL CHECK (skill_level >= 1 AND skill_level <= 10),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for session lookups
CREATE INDEX idx_players_session ON players(session_id);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  match_type match_type NOT NULL,
  status match_status NOT NULL DEFAULT 'pending',
  team_a_score INTEGER,
  team_b_score INTEGER,
  winner_side match_side,
  played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for session lookups
CREATE INDEX idx_matches_session ON matches(session_id);

-- Match players junction table
CREATE TABLE match_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  side match_side NOT NULL,
  UNIQUE(match_id, player_id)
);

-- Create indexes
CREATE INDEX idx_match_players_match ON match_players(match_id);
CREATE INDEX idx_match_players_player ON match_players(player_id);

-- Tournament pairs table (for doubles tournaments)
CREATE TABLE tournament_pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  player_one_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  player_two_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  pair_name VARCHAR(100),
  total_skill INTEGER NOT NULL,
  seed_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, player_one_id, player_two_id)
);

-- Create index
CREATE INDEX idx_tournament_pairs_session ON tournament_pairs(session_id);

-- Tournament brackets table (for elimination tournaments)
CREATE TABLE tournament_brackets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  bracket_type bracket_type NOT NULL DEFAULT 'winners',
  round_number INTEGER NOT NULL,
  position_in_round INTEGER NOT NULL,
  participant_one_id UUID, -- Can be player_id or pair_id
  participant_two_id UUID, -- Can be player_id or pair_id
  winner_id UUID,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, bracket_type, round_number, position_in_round)
);

-- Create index
CREATE INDEX idx_tournament_brackets_session ON tournament_brackets(session_id);

-- Tournament standings table (for round robin)
CREATE TABLE tournament_standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL, -- Can be player_id or pair_id
  participant_type participant_type NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  game_difference INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, participant_id)
);

-- Create index
CREATE INDEX idx_tournament_standings_session ON tournament_standings(session_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tournament_standings_updated_at
  BEFORE UPDATE ON tournament_standings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_standings ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (no authentication required)
-- You can restrict this later when adding authentication
CREATE POLICY "Allow public read access" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON sessions FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON players FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON matches FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON matches FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON match_players FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON match_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON match_players FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON match_players FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON tournament_pairs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON tournament_pairs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON tournament_pairs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON tournament_pairs FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON tournament_brackets FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON tournament_brackets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON tournament_brackets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON tournament_brackets FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON tournament_standings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON tournament_standings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON tournament_standings FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON tournament_standings FOR DELETE USING (true);
