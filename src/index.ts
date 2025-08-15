import dotenv from 'dotenv';
import PersonaMCPServer from './server';
import DatabaseMigrator from './database/migrate';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Starting Persona MCP Server...');
    
    // Check if we need to run migrations
    const shouldMigrate = process.env.AUTO_MIGRATE === 'true';
    
    if (shouldMigrate) {
      console.log('Running database migrations...');
      const migrator = new DatabaseMigrator();
      await migrator.runMigrations();
    }
    
    // Start the MCP server
    const server = new PersonaMCPServer();
    await server.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start Persona MCP Server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  main();
}

export default main;