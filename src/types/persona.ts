export interface PersonalityTrait {
  id: string;
  name: string;
  value: number; // 0-100 scale
  description: string;
  examples: string[];
  created_at: Date;
  updated_at: Date;
}

export interface CommunicationPattern {
  id: string;
  category: 'writing_style' | 'vocabulary' | 'tone' | 'structure' | 'humor' | 'formality';
  pattern: string;
  frequency: number; // How often this pattern appears
  context: string[]; // Contexts where this pattern is used
  examples: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'professional' | 'creative' | 'learning' | 'health' | 'financial';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  target_date?: Date;
  progress: number; // 0-100 percentage
  milestones: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Preference {
  id: string;
  category: string;
  key: string;
  value: any;
  description: string;
  importance: 'low' | 'medium' | 'high';
  created_at: Date;
  updated_at: Date;
}

export interface ThinkingPattern {
  id: string;
  pattern_type: 'decision_making' | 'problem_solving' | 'creativity' | 'analysis' | 'planning';
  description: string;
  triggers: string[]; // What situations trigger this pattern
  approach: string; // How you approach problems of this type
  examples: string[];
  effectiveness: number; // 0-100 scale
  created_at: Date;
  updated_at: Date;
}

export interface PersonaSnapshot {
  id: string;
  version: string;
  personality_traits: PersonalityTrait[];
  communication_patterns: CommunicationPattern[];
  goals: Goal[];
  preferences: Preference[];
  thinking_patterns: ThinkingPattern[];
  summary: string;
  confidence_score: number; // How well the AI understands the persona
  created_at: Date;
}

export interface PersonaLearningInput {
  content: string;
  content_type: 'text' | 'conversation' | 'decision' | 'preference' | 'goal';
  context?: string;
  metadata?: Record<string, any>;
}

export interface PersonaQuery {
  query_type: 'personality' | 'communication' | 'goals' | 'preferences' | 'thinking' | 'full_persona';
  context?: string;
  specific_traits?: string[];
  format?: 'detailed' | 'summary' | 'examples';
}

export interface PersonaResponse {
  persona_data: any;
  confidence_score: number;
  suggestions: string[];
  last_updated: Date;
}