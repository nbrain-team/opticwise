/**
 * Clear Semantic Cache
 * 
 * Clears old cached responses so new brand voice rules apply
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

async function clearCache() {
  console.log('🗑️  Clearing Semantic Cache...\n');
  
  try {
    // Get count before
    const beforeCount = await pool.query('SELECT COUNT(*) as count FROM "SemanticCache"');
    console.log(`Current cache entries: ${beforeCount.rows[0].count}`);
    
    // Delete all cache entries
    const result = await pool.query('DELETE FROM "SemanticCache" RETURNING id');
    
    console.log(`\n✅ Cleared ${result.rowCount} cache entries`);
    console.log('\n🎉 Semantic cache cleared successfully!');
    console.log('\n📝 Note: New responses will now be generated fresh with latest brand voice rules.\n');
    
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  clearCache()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { clearCache };
