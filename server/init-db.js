import Database from 'better-sqlite3';
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find CSV file
const possiblePaths = [
  path.join(__dirname, '../aura-papers/public/retraction_watch.csv'),
  path.join(process.cwd(), 'aura-papers/public/retraction_watch.csv'),
  path.resolve(__dirname, '../aura-papers/public/retraction_watch.csv'),
];

let csvPath = null;
for (const testPath of possiblePaths) {
  if (fs.existsSync(testPath)) {
    csvPath = testPath;
    break;
  }
}

if (!csvPath) {
  console.error('CSV file not found. Tried paths:');
  possiblePaths.forEach(p => console.error('  -', p));
  process.exit(1);
}

console.log(`Initializing database from: ${csvPath}`);

// Create or open database
const dbPath = path.join(__dirname, 'papers.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL'); // Faster writes
db.pragma('cache_size = -64000'); // 64MB cache
db.pragma('temp_store = MEMORY'); // Store temp tables in memory
db.pragma('mmap_size = 268435456'); // 256MB memory-mapped I/O

// Create table
console.log('Creating table...');
db.exec(`
  DROP TABLE IF EXISTS papers;
  
  CREATE TABLE papers (
    record_id TEXT PRIMARY KEY,
    title TEXT,
    subject TEXT,
    institution TEXT,
    journal TEXT,
    publisher TEXT,
    country TEXT,
    author TEXT,
    urls TEXT,
    article_type TEXT,
    retraction_date TEXT,
    retraction_doi TEXT,
    retraction_pubmed_id TEXT,
    original_paper_date TEXT,
    original_paper_doi TEXT,
    original_paper_pubmed_id TEXT,
    retraction_nature TEXT,
    reason TEXT,
    paywalled TEXT,
    notes TEXT
  );
`);

// Create indexes on commonly filtered columns
console.log('Creating indexes...');
db.exec(`
  -- Standard indexes for exact matches and sorting
  CREATE INDEX IF NOT EXISTS idx_author ON papers(author);
  CREATE INDEX IF NOT EXISTS idx_title ON papers(title);
  CREATE INDEX IF NOT EXISTS idx_journal ON papers(journal);
  CREATE INDEX IF NOT EXISTS idx_publisher ON papers(publisher);
  CREATE INDEX IF NOT EXISTS idx_country ON papers(country);
  CREATE INDEX IF NOT EXISTS idx_article_type ON papers(article_type);
  CREATE INDEX IF NOT EXISTS idx_institution ON papers(institution);
  CREATE INDEX IF NOT EXISTS idx_original_paper_date ON papers(original_paper_date);
  CREATE INDEX IF NOT EXISTS idx_retraction_date ON papers(retraction_date);
  CREATE INDEX IF NOT EXISTS idx_original_paper_doi ON papers(original_paper_doi);
  CREATE INDEX IF NOT EXISTS idx_retraction_doi ON papers(retraction_doi);
  CREATE INDEX IF NOT EXISTS idx_original_paper_pubmed_id ON papers(original_paper_pubmed_id);
  CREATE INDEX IF NOT EXISTS idx_retraction_pubmed_id ON papers(retraction_pubmed_id);
  
  -- Composite index for common filter combinations
  CREATE INDEX IF NOT EXISTS idx_journal_article_type ON papers(journal, article_type);
  CREATE INDEX IF NOT EXISTS idx_publisher_journal ON papers(publisher, journal);
  CREATE INDEX IF NOT EXISTS idx_date_range ON papers(original_paper_date, retraction_date);
`);

// Prepare insert statement
const insert = db.prepare(`
  INSERT INTO papers (
    record_id, title, subject, institution, journal, publisher, country,
    author, urls, article_type, retraction_date, retraction_doi,
    retraction_pubmed_id, original_paper_date, original_paper_doi,
    original_paper_pubmed_id, retraction_nature, reason, paywalled, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Read and parse CSV
console.log('Reading CSV file...');
const fileContent = fs.readFileSync(csvPath, 'utf-8');

const records = parse(fileContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`Importing ${records.length} records...`);

// Insert records in batches for better performance
const batchSize = 1000;
let inserted = 0;

const insertMany = db.transaction((records) => {
  for (const record of records) {
    insert.run(
      record['Record ID'] || null,
      record['Title'] || null,
      record['Subject'] || null,
      record['Institution'] || null,
      record['Journal'] || null,
      record['Publisher'] || null,
      record['Country'] || null,
      record['Author'] || null,
      record['URLS'] || null,
      record['ArticleType'] || null,
      record['RetractionDate'] || null,
      record['RetractionDOI'] || null,
      record['RetractionPubMedID'] || null,
      record['OriginalPaperDate'] || null,
      record['OriginalPaperDOI'] || null,
      record['OriginalPaperPubMedID'] || null,
      record['RetractionNature'] || null,
      record['Reason'] || null,
      record['Paywalled'] || null,
      record['Notes'] || null
    );
  }
});

// Process in batches
for (let i = 0; i < records.length; i += batchSize) {
  const batch = records.slice(i, i + batchSize);
  insertMany(batch);
  inserted += batch.length;
  process.stdout.write(`\rProgress: ${inserted}/${records.length} records inserted`);
}

console.log('\n✓ Database initialized successfully!');
console.log(`✓ Total records: ${inserted}`);

// Analyze tables for query optimization
console.log('Analyzing database for query optimization...');
db.exec('ANALYZE papers;');

db.close();
console.log('Database ready!');


