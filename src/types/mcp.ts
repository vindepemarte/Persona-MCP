// MCP SDK types - will be available after npm install
export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
}

export interface PersonaMCPTool extends Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface PersonaMCPResource extends Resource {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface MCPToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPResourceRequest {
  uri: string;
}

export interface MCPResourceResponse {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

// Available MCP Tools for Persona Server
export const PERSONA_MCP_TOOLS: PersonaMCPTool[] = [
  {
    name: 'learn_persona',
    description: 'Learn about the user\'s personality, communication style, goals, and preferences from provided content',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to learn from (text, conversation, decision, etc.)'
        },
        content_type: {
          type: 'string',
          enum: ['text', 'conversation', 'decision', 'preference', 'goal'],
          description: 'The type of content being provided'
        },
        context: {
          type: 'string',
          description: 'Additional context about the content'
        }
      },
      required: ['content', 'content_type']
    }
  },
  {
    name: 'get_persona',
    description: 'Retrieve persona information to understand how the user thinks, communicates, and behaves',
    inputSchema: {
      type: 'object',
      properties: {
        query_type: {
          type: 'string',
          enum: ['personality', 'communication', 'goals', 'preferences', 'thinking', 'full_persona'],
          description: 'What aspect of the persona to retrieve'
        },
        context: {
          type: 'string',
          description: 'Context for the query (e.g., "writing email", "making decision")'
        },
        format: {
          type: 'string',
          enum: ['detailed', 'summary', 'examples'],
          description: 'How detailed the response should be'
        }
      },
      required: ['query_type']
    }
  },
  {
    name: 'emulate_response',
    description: 'Generate a response as if you were the user, based on their persona',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The prompt or situation to respond to'
        },
        context: {
          type: 'string',
          description: 'The context or setting for the response'
        },
        response_type: {
          type: 'string',
          enum: ['email', 'message', 'decision', 'creative', 'analysis', 'casual'],
          description: 'The type of response needed'
        },
        tone: {
          type: 'string',
          enum: ['professional', 'casual', 'friendly', 'formal', 'creative', 'analytical'],
          description: 'The desired tone for the response'
        }
      },
      required: ['prompt']
    }
  },
  {
    name: 'analyze_compatibility',
    description: 'Analyze how compatible a given text or decision is with the user\'s persona',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'The content to analyze for compatibility'
        },
        analysis_type: {
          type: 'string',
          enum: ['writing_style', 'decision_making', 'values_alignment', 'communication_fit'],
          description: 'What aspect to analyze for compatibility'
        }
      },
      required: ['content']
    }
  },
  {
    name: 'update_goals',
    description: 'Update or modify the user\'s goals and priorities',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add', 'update', 'complete', 'pause', 'cancel'],
          description: 'What action to take on the goal'
        },
        goal_id: {
          type: 'string',
          description: 'ID of existing goal (for update/complete/pause/cancel actions)'
        },
        goal_data: {
          type: 'object',
          description: 'Goal data for add/update actions'
        }
      },
      required: ['action']
    }
  }
];