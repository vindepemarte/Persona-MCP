import Database from '../database/config';
import {
  PersonalityTrait,
  CommunicationPattern,
  Goal,
  Preference,
  ThinkingPattern,
  PersonaLearningInput,
  PersonaQuery,
  PersonaResponse
} from '../types/persona';

export interface LearningResult {
  success: boolean;
  insights_gained: string[];
  confidence_improvement: number;
  updated_traits: string[];
}

export interface EmulationRequest {
  prompt: string;
  context?: string;
  response_type: string;
  tone: string;
}

export interface EmulationResult {
  response: string;
  confidence_score: number;
  reasoning: string;
  persona_elements_used: string[];
}

export interface CompatibilityResult {
  compatibility_score: number;
  analysis: string;
  suggestions: string[];
  persona_differences: string[];
}

export interface GoalUpdateResult {
  success: boolean;
  message: string;
  updated_goal?: Goal;
  all_goals?: Goal[];
}

class PersonaService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async learnFromInput(input: PersonaLearningInput): Promise<LearningResult> {
    try {
      // Store the learning input in database
      await this.storeLearningInput(input);
      
      // Analyze content and extract insights
      const insights = await this.analyzeContent(input);
      
      // Update persona based on insights
      const updatedTraits = await this.updatePersonaFromInsights(insights);
      
      // Calculate confidence improvement
      const confidenceImprovement = Math.min(insights.length * 5, 25);
      
      return {
        success: true,
        insights_gained: insights,
        confidence_improvement: confidenceImprovement,
        updated_traits: updatedTraits
      };
    } catch (error) {
      console.error('Error in learnFromInput:', error);
      return {
        success: false,
        insights_gained: [],
        confidence_improvement: 0,
        updated_traits: []
      };
    }
  }

  async getPersonaData(query: PersonaQuery): Promise<PersonaResponse> {
    try {
      let personaData: any = {};
      let confidenceScore = 0;
      const suggestions: string[] = [];

      switch (query.query_type) {
        case 'personality':
          personaData = await this.getPersonalityTraits();
          confidenceScore = await this.calculateConfidenceScore('personality');
          break;
          
        case 'communication':
          personaData = await this.getCommunicationPatterns();
          confidenceScore = await this.calculateConfidenceScore('communication');
          break;
          
        case 'goals':
          personaData = await this.getGoals();
          confidenceScore = await this.calculateConfidenceScore('goals');
          break;
          
        case 'preferences':
          personaData = await this.getPreferences();
          confidenceScore = await this.calculateConfidenceScore('preferences');
          break;
          
        case 'thinking':
          personaData = await this.getThinkingPatterns();
          confidenceScore = await this.calculateConfidenceScore('thinking');
          break;
          
        case 'full_persona':
          personaData = await this.getFullPersona();
          confidenceScore = await this.calculateOverallConfidenceScore();
          break;
      }

      // Add suggestions based on confidence score
      if (confidenceScore < 50) {
        suggestions.push('Consider providing more examples to improve persona accuracy');
      }
      if (confidenceScore < 30) {
        suggestions.push('Persona data is limited. More learning input would be beneficial');
      }

      return {
        persona_data: personaData,
        confidence_score: confidenceScore,
        suggestions,
        last_updated: new Date()
      };
    } catch (error) {
      console.error('Error getting persona data:', error);
      throw error;
    }
  }

  async emulateResponse(request: EmulationRequest): Promise<EmulationResult> {
    try {
      // Get relevant persona data
      const personality = await this.getPersonalityTraits();
      const communication = await this.getCommunicationPatterns();
      const preferences = await this.getPreferences();
      
      // Generate response based on persona
      const response = await this.generatePersonaResponse(request, {
        personality,
        communication,
        preferences
      });
      
      return {
        response: response.text,
        confidence_score: response.confidence,
        reasoning: response.reasoning,
        persona_elements_used: response.elements_used
      };
    } catch (error) {
      console.error('Error emulating response:', error);
      throw error;
    }
  }

  async analyzeCompatibility(content: string, analysisType: string): Promise<CompatibilityResult> {
    try {
      // Get relevant persona data for comparison
      const personaData = await this.getRelevantPersonaForAnalysis(analysisType);
      
      // Analyze compatibility
      const analysis = await this.performCompatibilityAnalysis(content, personaData, analysisType);
      
      return {
        compatibility_score: analysis.score,
        analysis: analysis.description,
        suggestions: analysis.suggestions,
        persona_differences: analysis.differences
      };
    } catch (error) {
      console.error('Error analyzing compatibility:', error);
      throw error;
    }
  }

  async updateGoals(action: string, goalId?: string, goalData?: any): Promise<GoalUpdateResult> {
    try {
      let result: GoalUpdateResult = {
        success: false,
        message: ''
      };

      switch (action) {
        case 'add':
          if (!goalData) {
            throw new Error('Goal data is required for add action');
          }
          const newGoal = await this.addGoal(goalData);
          result = {
            success: true,
            message: 'Goal added successfully',
            updated_goal: newGoal
          };
          break;
          
        case 'update':
          if (!goalId || !goalData) {
            throw new Error('Goal ID and data are required for update action');
          }
          const updatedGoal = await this.updateGoal(goalId, goalData);
          result = {
            success: true,
            message: 'Goal updated successfully',
            updated_goal: updatedGoal
          };
          break;
          
        case 'complete':
          if (!goalId) {
            throw new Error('Goal ID is required for complete action');
          }
          await this.completeGoal(goalId);
          result = {
            success: true,
            message: 'Goal marked as completed'
          };
          break;
          
        case 'pause':
        case 'cancel':
          if (!goalId) {
            throw new Error('Goal ID is required for pause/cancel action');
          }
          await this.updateGoalStatus(goalId, action === 'pause' ? 'paused' : 'cancelled');
          result = {
            success: true,
            message: `Goal ${action}d successfully`
          };
          break;
      }

      // Get all goals for response
      result.all_goals = await this.getGoals();
      
      return result;
    } catch (error) {
      console.error('Error updating goals:', error);
      throw error;
    }
  }

  // Private helper methods
  private async analyzeContent(input: PersonaLearningInput): Promise<string[]> {
    const insights: string[] = [];
    
    try {
      // Try to parse as structured JSON data first
      const parsedData = JSON.parse(input.content);
      
      if (parsedData && typeof parsedData === 'object') {
        // Handle structured persona data from AI agent
        if (parsedData.name) {
          insights.push(`Name identified: ${parsedData.name}`);
          await this.storePersonalityTrait(`name: ${parsedData.name}`);
        }
        
        if (parsedData.traits && Array.isArray(parsedData.traits)) {
          for (const trait of parsedData.traits) {
            insights.push(`Personality trait: ${trait}`);
            await this.storePersonalityTrait(trait);
          }
        }
        
        if (parsedData.communication_style) {
          insights.push(`Communication style: ${parsedData.communication_style}`);
          await this.storeCommunicationPattern(parsedData.communication_style);
        }
        
        if (parsedData.work_environment) {
          insights.push(`Work environment preference: ${parsedData.work_environment}`);
          await this.storePreference('work_environment', parsedData.work_environment);
        }
        
        if (parsedData.communication_preference) {
          insights.push(`Communication preference: ${parsedData.communication_preference}`);
          await this.storePreference('communication_preference', parsedData.communication_preference);
        }
        
        if (parsedData.dislikes && Array.isArray(parsedData.dislikes)) {
          for (const dislike of parsedData.dislikes) {
            insights.push(`Dislike identified: ${dislike}`);
            await this.storePreference('dislikes', dislike);
          }
        }
        
        if (parsedData.goals && Array.isArray(parsedData.goals)) {
          for (const goal of parsedData.goals) {
            insights.push(`Goal identified: ${goal}`);
            await this.storeGoal(goal);
          }
        }
        
        return insights;
      }
    } catch (parseError) {
      // If JSON parsing fails, fall back to text analysis
      console.log('Content is not JSON, using text analysis');
    }
    
    // Basic content analysis for unstructured text
    const content = input.content.toLowerCase();
    
    // Detect personality indicators
    if (content.includes('i prefer') || content.includes('i like')) {
      insights.push('Preference detected');
    }
    if (content.includes('my goal') || content.includes('i want to')) {
      insights.push('Goal identified');
    }
    if (content.includes('i think') || content.includes('in my opinion')) {
      insights.push('Thinking pattern observed');
    }
    
    return insights;
  }

  private async updatePersonaFromInsights(insights: string[]): Promise<string[]> {
    const updatedTraits: string[] = [];
    
    // Process insights and categorize updates
    for (const insight of insights) {
      if (insight.includes('Name identified')) {
        updatedTraits.push('name');
      }
      if (insight.includes('Personality trait')) {
        updatedTraits.push('personality_traits');
      }
      if (insight.includes('Communication style')) {
        updatedTraits.push('communication_patterns');
      }
      if (insight.includes('preference') || insight.includes('environment')) {
        updatedTraits.push('preferences');
      }
      if (insight.includes('Goal identified')) {
        updatedTraits.push('goals');
      }
      if (insight.includes('Dislike identified')) {
        updatedTraits.push('preferences');
      }
      if (insight === 'Thinking pattern observed') {
        updatedTraits.push('thinking_patterns');
      }
    }
    
    return [...new Set(updatedTraits)]; // Remove duplicates
  }

  private async getPersonalityTraits(): Promise<PersonalityTrait[]> {
    const result = await this.db.query('SELECT * FROM personality_traits ORDER BY updated_at DESC');
    return result.rows;
  }

  private async getCommunicationPatterns(): Promise<CommunicationPattern[]> {
    const result = await this.db.query('SELECT * FROM communication_patterns ORDER BY frequency DESC');
    return result.rows;
  }

  private async getGoals(): Promise<Goal[]> {
    const result = await this.db.query('SELECT * FROM goals WHERE status = $1 ORDER BY priority DESC, created_at DESC', ['active']);
    return result.rows;
  }

  private async getPreferences(): Promise<Preference[]> {
    const result = await this.db.query('SELECT * FROM preferences ORDER BY importance DESC, category');
    return result.rows;
  }

  private async getThinkingPatterns(): Promise<ThinkingPattern[]> {
    const result = await this.db.query('SELECT * FROM thinking_patterns ORDER BY created_at DESC');
    return result.rows;
  }

  // Helper methods for storing structured persona data

  private async storeLearningInput(input: PersonaLearningInput): Promise<void> {
    await this.db.query(
      `INSERT INTO learning_inputs (content, content_type, context, metadata) 
       VALUES ($1, $2, $3, $4)`,
      [input.content, input.content_type, input.context || null, JSON.stringify(input.metadata || {})]
    );
  }

  private async storePersonalityTrait(trait: string): Promise<void> {
    // Extract trait type if it follows "type: value" format, otherwise use 'analytical' as default
    const [traitType, traitValue] = trait.includes(':') ? trait.split(':', 2).map(s => s.trim()) : ['analytical', trait];
    
    await this.db.query(
      `INSERT INTO personality_traits (name, trait_type, value, description, created_at) 
       VALUES ($1, $2, 80, $3, NOW()) 
       ON CONFLICT (name) DO UPDATE SET 
       value = GREATEST(personality_traits.value, 80), 
       description = COALESCE(personality_traits.description, $3),
       updated_at = NOW()`,
      [traitValue, traitType, trait]
    );
  }

  private async storeCommunicationPattern(pattern: string): Promise<void> {
    // Determine category based on pattern content
    let category = 'writing_style';
    if (pattern.toLowerCase().includes('tone') || pattern.toLowerCase().includes('formal') || pattern.toLowerCase().includes('casual')) {
      category = 'tone';
    } else if (pattern.toLowerCase().includes('structure') || pattern.toLowerCase().includes('organize')) {
      category = 'structure';
    } else if (pattern.toLowerCase().includes('humor') || pattern.toLowerCase().includes('joke')) {
      category = 'humor';
    }
    
    await this.db.query(
      `INSERT INTO communication_patterns (category, pattern, frequency, created_at) 
       VALUES ($1, $2, 1, NOW()) 
       ON CONFLICT (category, pattern) DO UPDATE SET 
       frequency = communication_patterns.frequency + 1, updated_at = NOW()`,
      [category, pattern]
    );
  }

  private async storePreference(category: string, value: string): Promise<void> {
    // Use category as key, store value as JSONB
    const jsonValue = typeof value === 'string' ? JSON.stringify({preference: value}) : JSON.stringify(value);
    
    await this.db.query(
      `INSERT INTO preferences (category, key, value, description, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       ON CONFLICT (category, key) DO UPDATE SET 
       value = $3, description = $4, updated_at = NOW()`,
      [category, category, jsonValue, `Preference for ${category}: ${value}`]
    );
  }

  private async storeGoal(goalDescription: string): Promise<void> {
    // Determine category based on goal content
    let category = 'personal';
    if (goalDescription.toLowerCase().includes('work') || goalDescription.toLowerCase().includes('career') || goalDescription.toLowerCase().includes('professional')) {
      category = 'professional';
    } else if (goalDescription.toLowerCase().includes('learn') || goalDescription.toLowerCase().includes('study') || goalDescription.toLowerCase().includes('skill')) {
      category = 'learning';
    } else if (goalDescription.toLowerCase().includes('creative') || goalDescription.toLowerCase().includes('art') || goalDescription.toLowerCase().includes('design')) {
      category = 'creative';
    } else if (goalDescription.toLowerCase().includes('health') || goalDescription.toLowerCase().includes('fitness') || goalDescription.toLowerCase().includes('exercise')) {
      category = 'health';
    } else if (goalDescription.toLowerCase().includes('money') || goalDescription.toLowerCase().includes('financial') || goalDescription.toLowerCase().includes('save')) {
      category = 'financial';
    }
    
    await this.db.query(
      `INSERT INTO goals (title, description, category, status, priority, created_at) 
       VALUES ($1, $2, $3, 'active', 'medium', NOW())`,
      [goalDescription, goalDescription, category]
    );
  }

  private async getFullPersona(): Promise<any> {
    const result = await this.db.query('SELECT * FROM persona_overview');
    
    const persona: any = {};
    for (const row of result.rows) {
      persona[row.data_type] = row.data;
    }
    
    return persona;
  }

  private async calculateConfidenceScore(dataType: string): Promise<number> {
    // Simple confidence calculation based on data availability
    let score = 0;
    
    switch (dataType) {
      case 'personality':
        const personalityCount = await this.db.query('SELECT COUNT(*) FROM personality_traits');
        score = Math.min(personalityCount.rows[0].count * 10, 100);
        break;
      case 'communication':
        const commCount = await this.db.query('SELECT COUNT(*) FROM communication_patterns');
        score = Math.min(commCount.rows[0].count * 15, 100);
        break;
      case 'goals':
        const goalsCount = await this.db.query('SELECT COUNT(*) FROM goals WHERE status = $1', ['active']);
        score = Math.min(goalsCount.rows[0].count * 20, 100);
        break;
      case 'preferences':
        const prefCount = await this.db.query('SELECT COUNT(*) FROM preferences');
        score = Math.min(prefCount.rows[0].count * 12, 100);
        break;
      case 'thinking':
        const thinkingCount = await this.db.query('SELECT COUNT(*) FROM thinking_patterns');
        score = Math.min(thinkingCount.rows[0].count * 18, 100);
        break;
    }
    
    return score;
  }

  private async calculateOverallConfidenceScore(): Promise<number> {
    const scores = await Promise.all([
      this.calculateConfidenceScore('personality'),
      this.calculateConfidenceScore('communication'),
      this.calculateConfidenceScore('goals'),
      this.calculateConfidenceScore('preferences'),
      this.calculateConfidenceScore('thinking')
    ]);
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private async generatePersonaResponse(request: EmulationRequest, personaData: any): Promise<{
    text: string;
    confidence: number;
    reasoning: string;
    elements_used: string[];
  }> {
    // This is a simplified implementation
    // In practice, you'd use the persona data to influence response generation
    
    const elementsUsed: string[] = [];
    let responseText = `Based on your persona, here's how you might respond to "${request.prompt}":\n\n`;
    
    // Use communication patterns
    if (personaData.communication && personaData.communication.length > 0) {
      const pattern = personaData.communication[0];
      responseText += `[Using ${pattern.category} pattern: ${pattern.pattern}]\n`;
      elementsUsed.push(`communication_${pattern.category}`);
    }
    
    // Use personality traits
    if (personaData.personality && personaData.personality.length > 0) {
      const trait = personaData.personality[0];
      responseText += `[Influenced by ${trait.name}: ${trait.description}]\n`;
      elementsUsed.push(`personality_${trait.name}`);
    }
    
    responseText += `\nThis response reflects your typical ${request.tone} ${request.response_type} style.`;
    
    return {
      text: responseText,
      confidence: 75, // Base confidence
      reasoning: 'Response generated based on available persona data',
      elements_used: elementsUsed
    };
  }

  private async getRelevantPersonaForAnalysis(analysisType: string): Promise<any> {
    switch (analysisType) {
      case 'writing_style':
        return await this.getCommunicationPatterns();
      case 'decision_making':
        return await this.getThinkingPatterns();
      case 'values_alignment':
        return await this.getPreferences();
      case 'communication_fit':
        return {
          communication: await this.getCommunicationPatterns(),
          personality: await this.getPersonalityTraits()
        };
      default:
        return await this.getFullPersona();
    }
  }

  private async performCompatibilityAnalysis(content: string, personaData: any, analysisType: string): Promise<{
    score: number;
    description: string;
    suggestions: string[];
    differences: string[];
  }> {
    // Simplified compatibility analysis
    // In practice, this would use more sophisticated text analysis
    
    const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
    
    return {
      score,
      description: `The provided content shows ${score}% compatibility with your ${analysisType} patterns.`,
      suggestions: [
        'Consider adjusting tone to better match your communication style',
        'Add more personal elements that reflect your personality'
      ],
      differences: [
        'Formality level differs from your typical style',
        'Vocabulary choice could be more aligned with your preferences'
      ]
    };
  }

  private async addGoal(goalData: any): Promise<Goal> {
    const result = await this.db.query(
      `INSERT INTO goals (title, description, category, priority, target_date, milestones) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        goalData.title,
        goalData.description,
        goalData.category,
        goalData.priority || 'medium',
        goalData.target_date || null,
        goalData.milestones || []
      ]
    );
    return result.rows[0];
  }

  private async updateGoal(goalId: string, goalData: any): Promise<Goal> {
    const result = await this.db.query(
      `UPDATE goals SET title = $1, description = $2, category = $3, priority = $4, 
       target_date = $5, progress = $6, milestones = $7 
       WHERE id = $8 RETURNING *`,
      [
        goalData.title,
        goalData.description,
        goalData.category,
        goalData.priority,
        goalData.target_date,
        goalData.progress || 0,
        goalData.milestones || [],
        goalId
      ]
    );
    return result.rows[0];
  }

  private async completeGoal(goalId: string): Promise<void> {
    await this.db.query(
      'UPDATE goals SET status = $1, progress = 100 WHERE id = $2',
      ['completed', goalId]
    );
  }

  private async updateGoalStatus(goalId: string, status: string): Promise<void> {
    await this.db.query(
      'UPDATE goals SET status = $1 WHERE id = $2',
      [status, goalId]
    );
  }
}

export default PersonaService;