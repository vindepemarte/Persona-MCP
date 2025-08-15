# Persona MCP Server

A Model Context Protocol (MCP) server that learns and emulates your personality, thinking patterns, communication style, goals, and preferences. This server enables AI agents to understand and respond as if they were you, making interactions more personalized and authentic.

## Features

- **Personality Learning**: Analyzes your communication patterns, preferences, and decision-making style
- **Goal Management**: Tracks and manages your personal and professional goals
- **Communication Emulation**: Generates responses in your unique voice and style
- **Compatibility Analysis**: Evaluates how well content aligns with your persona
- **PostgreSQL Integration**: Robust data storage with full ACID compliance
- **MCP Protocol**: Compatible with n8n AI agents and other MCP clients
- **Docker Support**: Easy deployment with Docker and Docker Compose
- **Coolify Ready**: One-click deployment on Coolify platform

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+ (or use Docker)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd persona-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb persona_mcp
   
   # Run migrations
   npm run migrate
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Docker Deployment

1. **Using Docker Compose (Recommended)**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f persona-mcp
   ```

2. **Access the services**
   - MCP Server: `http://localhost:3000`
   - PostgreSQL: `localhost:5432`
   - pgAdmin (optional): `http://localhost:8080`

### 🚀 Deployment Options

**Option 1: Coolify (Recommended for Production)**
1. Connect your Git repository to Coolify
2. Configure environment variables in Coolify's Environment Variables section (not .env files)
3. Required variables: `DATABASE_PASSWORD`, `DOMAIN`, `JWT_SECRET`, `API_KEY`, `NODE_ENV=production`
4. Click "Deploy" - Coolify automatically detects the `coolify.yml` configuration
5. PostgreSQL and the MCP server will be set up automatically with SSL and backups



### Coolify Deployment Details

1. **In your Coolify dashboard:**
   - Create a new project
   - Connect your Git repository
   - Coolify will automatically detect the `coolify.yml` configuration

2. **Set environment variables in Coolify Environment Variables section:**
   - `DATABASE_PASSWORD`: Strong password for PostgreSQL
   - `DOMAIN`: Your domain name (e.g., `persona-mcp.yourdomain.com`)
   - `JWT_SECRET`: Random secret for JWT tokens
   - `API_KEY`: API key for external access
   - `NODE_ENV`: Set to `production`
   - `AUTO_MIGRATE`: Set to `true` for automatic database setup
   - `LOG_LEVEL`: Set to `info` or `warn` for production

   **Important:** Do NOT use `.env` files for Coolify deployment. All environment variables must be configured through Coolify's Environment Variables interface.

3. **Deploy:**
   - Click "Deploy" in Coolify
   - The system will automatically set up PostgreSQL and the MCP server
   - Database migrations will run automatically if `AUTO_MIGRATE=true`

## MCP Tools Available

The server provides these MCP tools for AI agents:

### 1. `learn_persona`
Learn about your personality from provided content.

```json
{
  "name": "learn_persona",
  "arguments": {
    "content": "I prefer working in quiet environments and like to plan things in advance.",
    "content_type": "preference",
    "context": "work preferences"
  }
}
```

### 2. `get_persona`
Retrieve persona information for AI understanding.

```json
{
  "name": "get_persona",
  "arguments": {
    "query_type": "communication",
    "context": "writing email",
    "format": "detailed"
  }
}
```

### 3. `emulate_response`
Generate responses in your style.

```json
{
  "name": "emulate_response",
  "arguments": {
    "prompt": "How should I respond to this meeting invitation?",
    "context": "professional email",
    "response_type": "email",
    "tone": "professional"
  }
}
```

### 4. `analyze_compatibility`
Analyze how well content matches your persona.

```json
{
  "name": "analyze_compatibility",
  "arguments": {
    "content": "Let's schedule a quick call to discuss this.",
    "analysis_type": "communication_fit"
  }
}
```

### 5. `update_goals`
Manage your goals and objectives.

```json
{
  "name": "update_goals",
  "arguments": {
    "action": "add",
    "goal_data": {
      "title": "Learn Spanish",
      "description": "Become conversational in Spanish within 6 months",
      "category": "learning",
      "priority": "medium"
    }
  }
}
```

## Integration with n8n

1. **Install n8n MCP node** (if available) or use HTTP requests
2. **Configure MCP connection:**
   - Server URL: `http://your-server:3000`
   - Protocol: MCP
   - Authentication: API Key (if configured)

3. **Example n8n workflow:**
   ```json
   {
     "nodes": [
       {
         "name": "Learn from Email",
         "type": "MCP",
         "parameters": {
           "tool": "learn_persona",
           "content": "{{$json.email_content}}",
           "content_type": "text"
         }
       },
       {
         "name": "Generate Response",
         "type": "MCP",
         "parameters": {
           "tool": "emulate_response",
           "prompt": "{{$json.original_message}}",
           "response_type": "email"
         }
       }
     ]
   }
   ```

## Database Schema

The server uses PostgreSQL with the following main tables:

- **personality_traits**: Core personality characteristics
- **communication_patterns**: Writing and speaking patterns
- **goals**: Personal and professional objectives
- **preferences**: User preferences and settings
- **thinking_patterns**: Decision-making and problem-solving approaches
- **learning_inputs**: Historical learning data
- **persona_snapshots**: Versioned persona states
- **mcp_interactions**: Interaction logs and analytics

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `persona_mcp` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `` |
| `AUTO_MIGRATE` | Run migrations on start | `true` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |

### Database Management

```bash
# Run migrations
npm run migrate

# Reset database (WARNING: Deletes all data)
ts-node src/database/migrate.ts reset

# Drop all tables
ts-node src/database/migrate.ts down
```

## API Endpoints

While primarily an MCP server, basic HTTP endpoints are available:

- `GET /health` - Health check
- `POST /mcp` - MCP protocol endpoint
- `GET /persona/overview` - Get persona summary
- `POST /persona/learn` - Learn from input

## Security Considerations

1. **Database Security**: Use strong passwords and enable SSL in production
2. **Network Security**: Run behind a reverse proxy (nginx, Traefik)
3. **API Security**: Implement API key authentication for HTTP endpoints
4. **Data Privacy**: Persona data is sensitive - ensure proper access controls
5. **Backup Strategy**: Regular database backups are essential

## Monitoring and Logging

- **Application Logs**: Stored in `/app/logs/` directory
- **Database Logs**: PostgreSQL logs for query analysis
- **Health Checks**: Built-in health endpoints for monitoring
- **Metrics**: MCP interaction logs for usage analytics

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check PostgreSQL is running
   pg_isready -h localhost -p 5432
   
   # Verify credentials
   psql -h localhost -U postgres -d persona_mcp
   ```

2. **Migration Errors**
   ```bash
   # Reset and retry
   npm run migrate -- reset
   ```

3. **MCP Connection Issues**
   - Verify server is running on correct port
   - Check firewall settings
   - Validate MCP client configuration

### Logs

```bash
# View application logs
docker-compose logs -f persona-mcp

# View database logs
docker-compose logs -f postgres

# View all logs
docker-compose logs -f
```

## Development

### Project Structure

```
src/
├── database/           # Database configuration and migrations
│   ├── config.ts      # Database connection
│   ├── migrate.ts     # Migration runner
│   └── schema.sql     # Database schema
├── services/          # Business logic
│   └── PersonaService.ts
├── types/             # TypeScript type definitions
│   ├── persona.ts     # Persona-related types
│   └── mcp.ts         # MCP protocol types
├── server.ts          # MCP server implementation
└── index.ts           # Application entry point
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint
```

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed information

---

**Note**: This server learns and stores personal information. Ensure you comply with relevant privacy laws and regulations in your jurisdiction.