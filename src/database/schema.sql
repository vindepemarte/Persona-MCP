-- Persona MCP Server Database Schema
-- PostgreSQL Database Schema for storing user persona data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (with conditional creation)
DO $$ BEGIN
    CREATE TYPE personality_trait_type AS ENUM (
      'openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism',
      'creativity', 'analytical', 'empathy', 'leadership', 'humor', 'optimism', 'risk_tolerance'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE communication_category AS ENUM (
      'writing_style', 'vocabulary', 'tone', 'structure', 'humor', 'formality'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_category AS ENUM (
      'personal', 'professional', 'creative', 'learning', 'health', 'financial'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE thinking_pattern_type AS ENUM (
      'decision_making', 'problem_solving', 'creativity', 'analysis', 'planning'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE importance_level AS ENUM ('low', 'medium', 'high');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE content_type AS ENUM (
      'text', 'conversation', 'decision', 'preference', 'goal'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main tables

-- Personality Traits Table
CREATE TABLE IF NOT EXISTS personality_traits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  trait_type personality_trait_type,
  value INTEGER CHECK (value >= 0 AND value <= 100),
  description TEXT,
  examples TEXT[],
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Communication Patterns Table
CREATE TABLE IF NOT EXISTS communication_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category communication_category NOT NULL,
  pattern TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  context TEXT[],
  examples TEXT[],
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category goal_category NOT NULL,
  priority goal_priority DEFAULT 'medium',
  status goal_status DEFAULT 'active',
  target_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  milestones TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Preferences Table
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(100) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value JSONB,
  description TEXT,
  importance importance_level DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key)
);

-- Thinking Patterns Table
CREATE TABLE IF NOT EXISTS thinking_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pattern_type thinking_pattern_type NOT NULL,
  description TEXT NOT NULL,
  triggers TEXT[],
  approach TEXT,
  examples TEXT[],
  effectiveness INTEGER DEFAULT 50 CHECK (effectiveness >= 0 AND effectiveness <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Learning Input History Table
CREATE TABLE IF NOT EXISTS learning_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  content_type content_type NOT NULL,
  context TEXT,
  metadata JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Persona Snapshots Table (for versioning)
CREATE TABLE IF NOT EXISTS persona_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(20) NOT NULL,
  summary TEXT,
  confidence_score INTEGER DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  snapshot_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MCP Interaction Logs Table
CREATE TABLE IF NOT EXISTS mcp_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_name VARCHAR(100) NOT NULL,
  input_data JSONB,
  output_data JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personality_traits_type ON personality_traits(trait_type);
CREATE INDEX IF NOT EXISTS idx_personality_traits_updated ON personality_traits(updated_at);

CREATE INDEX IF NOT EXISTS idx_communication_patterns_category ON communication_patterns(category);
CREATE INDEX IF NOT EXISTS idx_communication_patterns_updated ON communication_patterns(updated_at);

CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_priority ON goals(priority);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_updated ON goals(updated_at);

CREATE INDEX IF NOT EXISTS idx_preferences_category ON preferences(category);
CREATE INDEX IF NOT EXISTS idx_preferences_importance ON preferences(importance);

CREATE INDEX IF NOT EXISTS idx_thinking_patterns_type ON thinking_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_thinking_patterns_updated ON thinking_patterns(updated_at);

CREATE INDEX IF NOT EXISTS idx_learning_inputs_type ON learning_inputs(content_type);
CREATE INDEX IF NOT EXISTS idx_learning_inputs_processed ON learning_inputs(processed);
CREATE INDEX IF NOT EXISTS idx_learning_inputs_created ON learning_inputs(created_at);

CREATE INDEX IF NOT EXISTS idx_persona_snapshots_version ON persona_snapshots(version);
CREATE INDEX IF NOT EXISTS idx_persona_snapshots_created ON persona_snapshots(created_at);

CREATE INDEX IF NOT EXISTS idx_mcp_interactions_tool ON mcp_interactions(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_interactions_created ON mcp_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_mcp_interactions_success ON mcp_interactions(success);

-- Create triggers for updating updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_personality_traits_updated_at ON personality_traits;
CREATE TRIGGER update_personality_traits_updated_at BEFORE UPDATE ON personality_traits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_communication_patterns_updated_at ON communication_patterns;
CREATE TRIGGER update_communication_patterns_updated_at BEFORE UPDATE ON communication_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_preferences_updated_at ON preferences;
CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_thinking_patterns_updated_at ON thinking_patterns;
CREATE TRIGGER update_thinking_patterns_updated_at BEFORE UPDATE ON thinking_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default personality traits structure (only if not exists)
INSERT INTO personality_traits (name, trait_type, value, description, examples) VALUES
('Openness to Experience', 'openness', 70, 'Willingness to try new things and think outside the box', ARRAY['Enjoys learning new skills', 'Open to different perspectives']),
('Conscientiousness', 'conscientiousness', 80, 'Organization, responsibility, and attention to detail', ARRAY['Plans ahead', 'Meets deadlines consistently']),
('Extraversion', 'extraversion', 60, 'Energy derived from social interaction', ARRAY['Enjoys group discussions', 'Comfortable presenting']),
('Agreeableness', 'agreeableness', 75, 'Tendency to be cooperative and trusting', ARRAY['Seeks consensus', 'Considers others feelings']),
('Emotional Stability', 'neuroticism', 30, 'Ability to remain calm under pressure (low neuroticism)', ARRAY['Stays calm in crises', 'Handles stress well'])
ON CONFLICT (name) DO NOTHING;

-- Insert some default communication patterns
INSERT INTO communication_patterns (category, pattern, frequency, context, examples) VALUES
('writing_style', 'Clear and concise', 8, ARRAY['emails', 'documentation'], ARRAY['Gets to the point quickly', 'Uses bullet points']),
('tone', 'Professional but friendly', 7, ARRAY['work communication'], ARRAY['Uses please and thank you', 'Maintains warmth']),
('vocabulary', 'Technical when appropriate', 6, ARRAY['technical discussions'], ARRAY['Uses industry terms correctly', 'Explains complex concepts simply'])
ON CONFLICT (category, pattern) DO NOTHING;

-- Insert some default preferences
INSERT INTO preferences (category, key, value, description, importance) VALUES
('work_style', 'preferred_communication', '"email"', 'Prefers email over phone calls for non-urgent matters', 'medium'),
('decision_making', 'research_depth', '"thorough"', 'Prefers to research thoroughly before making decisions', 'high'),
('creativity', 'brainstorming_style', '"collaborative"', 'Works best when brainstorming with others', 'medium')
ON CONFLICT (category, key) DO NOTHING;

-- Create a view for easy persona retrieval
CREATE VIEW persona_overview AS
SELECT 
  'personality' as data_type,
  json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'type', trait_type,
      'value', value,
      'description', description,
      'examples', examples,
      'confidence_score', confidence_score
    )
  ) as data
FROM personality_traits
UNION ALL
SELECT 
  'communication' as data_type,
  json_agg(
    json_build_object(
      'id', id,
      'category', category,
      'pattern', pattern,
      'frequency', frequency,
      'context', context,
      'examples', examples
    )
  ) as data
FROM communication_patterns
UNION ALL
SELECT 
  'goals' as data_type,
  json_agg(
    json_build_object(
      'id', id,
      'title', title,
      'description', description,
      'category', category,
      'priority', priority,
      'status', status,
      'progress', progress
    )
  ) as data
FROM goals
WHERE status = 'active'
UNION ALL
SELECT 
  'preferences' as data_type,
  json_agg(
    json_build_object(
      'id', id,
      'category', category,
      'key', key,
      'value', value,
      'description', description,
      'importance', importance
    )
  ) as data
FROM preferences
UNION ALL
SELECT 
  'thinking_patterns' as data_type,
  json_agg(
    json_build_object(
      'id', id,
      'pattern_type', pattern_type,
      'description', description,
      'triggers', triggers,
      'approach', approach,
      'effectiveness', effectiveness
    )
  ) as data
FROM thinking_patterns;