import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'papers.db');

console.log('Starting database migration...');

try {
  const db = new Database(dbPath);
  
  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');
  
  // Step 1: Add institution column if it doesn't exist
  console.log('Checking for institution column...');
  const tableInfo = db.prepare("PRAGMA table_info(papers)").all();
  const hasInstitution = tableInfo.some(col => col.name === 'institution');
  
  if (!hasInstitution) {
    console.log('Adding institution column...');
    db.exec('ALTER TABLE papers ADD COLUMN institution TEXT');
    console.log('✓ Institution column added');
    
    // Create index on institution if it doesn't exist
    db.exec('CREATE INDEX IF NOT EXISTS idx_institution ON papers(institution)');
    console.log('✓ Institution index created');
  } else {
    console.log('✓ Institution column already exists');
  }
  
  // Step 2: Get current count
  const countBefore = db.prepare('SELECT COUNT(*) as count FROM papers').get();
  console.log(`\nCurrent record count: ${countBefore.count}`);
  
  // Step 3: Delete 40,000 records
  const deleteCount = 40000;
  console.log(`\nDeleting ${deleteCount.toLocaleString()} records...`);
  
  // Delete records in batches to avoid locking the database
  const batchSize = 1000;
  let deleted = 0;
  
  // Use a transaction for better performance
  const deleteBatch = db.transaction((batchSize) => {
    // Delete oldest records based on record_id (assuming they're sequential)
    // If you want to delete by a different criteria, modify this query
    const stmt = db.prepare(`
      DELETE FROM papers 
      WHERE record_id IN (
        SELECT record_id FROM papers 
        ORDER BY record_id 
        LIMIT ?
      )
    `);
    
    const result = stmt.run(batchSize);
    return result.changes;
  });
  
  // Delete in batches
  while (deleted < deleteCount) {
    const remaining = deleteCount - deleted;
    const currentBatch = Math.min(batchSize, remaining);
    
    const changes = deleteBatch(currentBatch);
    deleted += changes;
    
    process.stdout.write(`\rProgress: ${deleted.toLocaleString()}/${deleteCount.toLocaleString()} records deleted`);
    
    // If no more records were deleted, break
    if (changes === 0) {
      console.log('\n⚠ No more records to delete');
      break;
    }
  }
  
  console.log('\n✓ Deletion complete');
  
  // Step 4: Get final count
  const countAfter = db.prepare('SELECT COUNT(*) as count FROM papers').get();
  console.log(`\nFinal record count: ${countAfter.count}`);
  console.log(`Records deleted: ${(countBefore.count - countAfter.count).toLocaleString()}`);
  
  // Step 5: Vacuum database to reclaim space
  console.log('\nVacuuming database to reclaim space...');
  db.exec('VACUUM');
  console.log('✓ Database vacuumed');
  
  // Step 6: Rebuild indexes for optimal performance
  console.log('\nRebuilding indexes...');
  db.exec('REINDEX');
  console.log('✓ Indexes rebuilt');
  
  // Step 7: Analyze for query optimization
  console.log('\nAnalyzing database for query optimization...');
  db.exec('ANALYZE papers');
  console.log('✓ Analysis complete');
  
  db.close();
  console.log('\n✓ Migration completed successfully!');
  
} catch (error) {
  console.error('\n✗ Error during migration:', error);
  process.exit(1);
}


