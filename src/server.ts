// Simplified MCP Server implementation
// Note: Install @modelcontextprotocol/sdk for full functionality

interface MCPRequest {
  jsonrpc: string;
  id: string | number;
  method: string;
  params: any;
}

interface MCPResponse {
  jsonrpc: string;
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

class SimpleMCPServer {
  private handlers: Map<string, (params: any) => Promise<any>> = new Map();
  
  setRequestHandler(method: string, handler: (params: any) => Promise<any>) {
    this.handlers.set(method, handler);
  }
  
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const handler = this.handlers.get(request.method);
    
    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method not found: ${request.method}`
        }
      };
    }
    
    try {
      const result = await handler(request.params);
      return {
        jsonrpc: '2.0',
        id: request.id,
        result
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error'
        }
      };
    }
  }
  
  async connect() {
    // Simplified connection - in real implementation, this would handle stdio
    console.log('MCP Server connected');
  }
}

import Database from './database/config';
import PersonaService from './services/PersonaService';
import { PERSONA_MCP_TOOLS } from './types/mcp';
import { PersonaLearningInput, PersonaQuery } from './types/persona';

class PersonaMCPServer {
  private server: SimpleMCPServer;
  private db: Database;
  private personaService: PersonaService;

  constructor() {
    this.server = new SimpleMCPServer();
    this.db = Database.getInstance();
    this.personaService = new PersonaService();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: PERSONA_MCP_TOOLS,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler('tools/call', async (params: any) => {
      const { name, arguments: args } = params;

      try {
        switch (name) {
          case 'learn_persona':
            return await this.handleLearnPersona(args);
          
          case 'get_persona':
            return await this.handleGetPersona(args);
          
          case 'emulate_response':
            return await this.handleEmulateResponse(args);
          
          case 'analyze_compatibility':
            return await this.handleAnalyzeCompatibility(args);
          
          case 'update_goals':
            return await this.handleUpdateGoals(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`Error handling tool ${name}:`, error);
        
        // Log the interaction
        await this.logInteraction(name, args, null, false, error instanceof Error ? error.message : 'Unknown error');
        
        throw error;
      }
    });
  }

  private async handleLearnPersona(args: any) {
    const { content, content_type, context } = args;
    
    const learningInput: PersonaLearningInput = {
      content,
      content_type,
      context,
      metadata: {}
    };

    const result = await this.personaService.learnFromInput(learningInput);
    
    await this.logInteraction('learn_persona', args, result, true);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Successfully learned from the provided content',
            insights_gained: result.insights_gained,
            confidence_improvement: result.confidence_improvement,
            updated_traits: result.updated_traits
          }, null, 2)
        }
      ]
    };
  }

  private async handleGetPersona(args: any) {
    const { query_type, context, format = 'detailed' } = args;
    
    const query: PersonaQuery = {
      query_type,
      context,
      format
    };

    const result = await this.personaService.getPersonaData(query);
    
    await this.logInteraction('get_persona', args, result, true);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            query_type,
            persona_data: result.persona_data,
            confidence_score: result.confidence_score,
            suggestions: result.suggestions,
            last_updated: result.last_updated
          }, null, 2)
        }
      ]
    };
  }

  private async handleEmulateResponse(args: any) {
    const { prompt, context, response_type = 'casual', tone = 'friendly' } = args;
    
    const result = await this.personaService.emulateResponse({
      prompt,
      context,
      response_type,
      tone
    });
    
    await this.logInteraction('emulate_response', args, result, true);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            original_prompt: prompt,
            emulated_response: result.response,
            confidence_score: result.confidence_score,
            reasoning: result.reasoning,
            persona_elements_used: result.persona_elements_used
          }, null, 2)
        }
      ]
    };
  }

  private async handleAnalyzeCompatibility(args: any) {
    const { content, analysis_type = 'writing_style' } = args;
    
    const result = await this.personaService.analyzeCompatibility(content, analysis_type);
    
    await this.logInteraction('analyze_compatibility', args, result, true);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            content_analyzed: content,
            analysis_type,
            compatibility_score: result.compatibility_score,
            analysis: result.analysis,
            suggestions: result.suggestions,
            persona_differences: result.persona_differences
          }, null, 2)
        }
      ]
    };
  }

  private async handleUpdateGoals(args: any) {
    const { action, goal_id, goal_data } = args;
    
    const result = await this.personaService.updateGoals(action, goal_id, goal_data);
    
    await this.logInteraction('update_goals', args, result, true);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            action,
            success: result.success,
            message: result.message,
            updated_goal: result.updated_goal,
            all_goals: result.all_goals
          }, null, 2)
        }
      ]
    };
  }

  private async logInteraction(
    toolName: string, 
    inputData: any, 
    outputData: any, 
    success: boolean, 
    errorMessage?: string
  ): Promise<void> {
    try {
      const startTime = Date.now();
      
      await this.db.query(
        `INSERT INTO mcp_interactions 
         (tool_name, input_data, output_data, success, error_message, execution_time_ms) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          toolName,
          JSON.stringify(inputData),
          JSON.stringify(outputData),
          success,
          errorMessage || null,
          Date.now() - startTime
        ]
      );
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }

  // Simple HTTP server for health checks
  private setupHttpServer(): void {
    const http = require('http');
    const port = process.env.PORT || 3000;
    
    const server = http.createServer((req: any, res: any) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }));
      } else if (req.url === '/mcp' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => body += chunk);
        req.on('end', async () => {
          try {
            const request = JSON.parse(body);
            let response;
            
            if (request.method === 'tools/list') {
              response = { tools: PERSONA_MCP_TOOLS };
            } else if (request.method === 'tools/call') {
              const toolName = request.params?.name;
              const args = request.params?.arguments || {};
              
              switch (toolName) {
                 case 'learn_persona':
                   response = await this.handleLearnPersona(args);
                   break;
                 case 'get_persona':
                   response = await this.handleGetPersona(args);
                   break;
                 case 'emulate_response':
                   response = await this.handleEmulateResponse(args);
                   break;
                 case 'analyze_compatibility':
                   response = await this.handleAnalyzeCompatibility(args);
                   break;
                 case 'update_goals':
                   response = await this.handleUpdateGoals(args);
                   break;
                 default:
                   response = { error: `Unknown tool: ${toolName}` };
               }
            } else {
              response = { error: 'Unknown method' };
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request' }));
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });
    
    server.listen(port, () => {
      console.log(`🌐 HTTP server listening on port ${port}`);
    });
  }

  async start(): Promise<void> {
    try {
      // Test database connection
      const isConnected = await this.db.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database. Please check your database configuration.');
      }
      console.log('✅ Database connection established');

      // Setup HTTP server for health checks and basic MCP
      this.setupHttpServer();

      // Start the server
      console.log('🚀 Persona MCP Server started');
      
      await this.server.connect();
      
      console.log('Persona MCP Server is running and ready to receive requests!');
      console.log('Available tools:', PERSONA_MCP_TOOLS.map(t => t.name).join(', '));
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.db.close();
    console.log('Persona MCP Server stopped.');
  }
}

export default PersonaMCPServer;