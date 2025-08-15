import fs from 'fs';
import path from 'path';
import Database from './config';

class DatabaseMigrator {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('Starting database migration...');
      
      // Test connection first
      const isConnected = await this.db.testConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      // Read and execute schema SQL
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      console.log('Executing database schema...');
      await this.db.query(schemaSql);
      
      console.log('Database migration completed successfully!');
      
      // Verify tables were created
      await this.verifyTables();
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async verifyTables(): Promise<void> {
    const expectedTables = [
      'personality_traits',
      'communication_patterns', 
      'goals',
      'preferences',
      'thinking_patterns',
      'learning_inputs',
      'persona_snapshots',
      'mcp_interactions'
    ];

    console.log('Verifying tables were created...');
    
    for (const table of expectedTables) {
      const result = await this.db.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      if (result.rows[0].exists) {
        console.log(`✓ Table '${table}' created successfully`);
      } else {
        throw new Error(`Table '${table}' was not created`);
      }
    }
    
    // Check if view was created
    const viewResult = await this.db.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'persona_overview'
      )`
    );
    
    if (viewResult.rows[0].exists) {
      console.log(`✓ View 'persona_overview' created successfully`);
    } else {
      throw new Error(`View 'persona_overview' was not created`);
    }
  }

  async dropAllTables(): Promise<void> {
    console.log('WARNING: Dropping all tables...');
    
    const dropQueries = [
      'DROP VIEW IF EXISTS persona_overview CASCADE;',
      'DROP TABLE IF EXISTS mcp_interactions CASCADE;',
      'DROP TABLE IF EXISTS persona_snapshots CASCADE;',
      'DROP TABLE IF EXISTS learning_inputs CASCADE;',
      'DROP TABLE IF EXISTS thinking_patterns CASCADE;',
      'DROP TABLE IF EXISTS preferences CASCADE;',
      'DROP TABLE IF EXISTS goals CASCADE;',
      'DROP TABLE IF EXISTS communication_patterns CASCADE;',
      'DROP TABLE IF EXISTS personality_traits CASCADE;',
      'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;',
      'DROP TYPE IF EXISTS content_type CASCADE;',
      'DROP TYPE IF EXISTS importance_level CASCADE;',
      'DROP TYPE IF EXISTS thinking_pattern_type CASCADE;',
      'DROP TYPE IF EXISTS goal_status CASCADE;',
      'DROP TYPE IF EXISTS goal_priority CASCADE;',
      'DROP TYPE IF EXISTS goal_category CASCADE;',
      'DROP TYPE IF EXISTS communication_category CASCADE;',
      'DROP TYPE IF EXISTS personality_trait_type CASCADE;'
    ];

    for (const query of dropQueries) {
      try {
        await this.db.query(query);
      } catch (error) {
        // Ignore errors for non-existent objects
        console.log(`Note: ${query} - object may not exist`);
      }
    }
    
    console.log('All tables and types dropped successfully');
  }

  async resetDatabase(): Promise<void> {
    await this.dropAllTables();
    await this.runMigrations();
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
      migrator.runMigrations()
        .then(() => {
          console.log('Migration completed!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('Migration failed:', error);
          process.exit(1);
        });
      break;
      
    case 'down':
      migrator.dropAllTables()
        .then(() => {
          console.log('Tables dropped!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('Drop failed:', error);
          process.exit(1);
        });
      break;
      
    case 'reset':
      migrator.resetDatabase()
        .then(() => {
          console.log('Database reset completed!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('Reset failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage: ts-node migrate.ts [up|down|reset]');
      console.log('  up    - Run migrations (create tables)');
      console.log('  down  - Drop all tables');
      console.log('  reset - Drop and recreate all tables');
      process.exit(1);
  }
}

export default DatabaseMigrator;