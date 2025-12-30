import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Enable compression for all responses
app.use(compression());
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(__dirname, 'papers.db');
let db;

// Prepared statements cache
const preparedStatements = {};

// Options cache (refresh every 5 minutes)
let optionsCache = null;
let optionsCacheTime = 0;
const OPTIONS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

try {
  db = new Database(dbPath, { 
    verbose: null // Disable verbose logging for performance
  });
  
  // Performance optimizations
  db.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrency
  db.pragma('synchronous = NORMAL'); // Faster writes
  db.pragma('cache_size = -64000'); // 64MB cache
  db.pragma('temp_store = MEMORY'); // Store temp tables in memory
  db.pragma('mmap_size = 268435456'); // 256MB memory-mapped I/O
  
  // Prepare commonly used statements
  preparedStatements.countAll = db.prepare('SELECT COUNT(*) as count FROM papers');
  preparedStatements.getPapers = db.prepare(`
    SELECT * FROM papers 
    ORDER BY record_id 
    LIMIT ? OFFSET ?
  `);
  
  // Get total count
  const countResult = preparedStatements.countAll.get();
  console.log(`✓ Database connected. Total papers: ${countResult.count}`);
} catch (error) {
  console.error('Error connecting to database:', error);
  console.error('Please run: npm run init-db');
  process.exit(1);
}

// Saveetha/SIMATS institution name variations for smart matching
const SAVEETHA_KEYWORDS = [
  'saveetha',
  'simats',
  'sse',
  'saveethaengineeringcollege',
  'saveetha engineering college',
  'saveetha school of engineering',
  'saveetha institute of medical and technical sciences',
  'simats university',
  'simats deemed university',
  'saveetha dental college',
  'saveetha medical college'
];

// Check if a search term matches any Saveetha/SIMATS variation (case-insensitive)
function isSaveethaSearch(searchTerm) {
  const normalized = searchTerm.toLowerCase().replace(/\s+/g, '');
  return SAVEETHA_KEYWORDS.some(keyword => {
    const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '');
    return normalized.includes(normalizedKeyword) || normalizedKeyword.includes(normalized);
  });
}

// Helper function to normalize text for search (lowercase, remove extra spaces)
function normalizeForSearch(text) {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/\s+/g, '');
}

// Helper function to build WHERE clause for search (optimized for indexed columns)
// Enhanced: All fields support case-insensitive AND space-insensitive matching
function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  // Author search - case and space insensitive
  if (filters.author && filters.author.trim()) {
    const authorNormalized = normalizeForSearch(filters.author);
    // Search both with and without spaces for flexibility
    conditions.push("(LOWER(REPLACE(author, ' ', '')) LIKE ? OR LOWER(author) LIKE ?)");
    params.push(`%${authorNormalized}%`, `%${filters.author.toLowerCase().trim()}%`);
  }

  // Title search - case and space insensitive
  if (filters.title && filters.title.trim()) {
    const titleNormalized = normalizeForSearch(filters.title);
    // Search both with and without spaces for flexibility
    conditions.push("(LOWER(REPLACE(title, ' ', '')) LIKE ? OR LOWER(title) LIKE ?)");
    params.push(`%${titleNormalized}%`, `%${filters.title.toLowerCase().trim()}%`);
  }

  // Article type - case and space insensitive matching
  if (filters.articleType && filters.articleType.trim()) {
    const articleTypeNormalized = normalizeForSearch(filters.articleType);
    // Match both normalized (no spaces) and original format
    conditions.push("(LOWER(REPLACE(article_type, ' ', '')) = ? OR LOWER(article_type) = LOWER(?))");
    params.push(articleTypeNormalized, filters.articleType.trim());
  }

  // Country search - case and space insensitive
  if (filters.country && filters.country.trim()) {
    const countryNormalized = normalizeForSearch(filters.country);
    const countryLower = filters.country.toLowerCase().trim();
    // Country can contain multiple values separated by semicolon
    conditions.push(`(
      LOWER(REPLACE(country, ' ', '')) LIKE ? OR 
      LOWER(country) LIKE ? OR 
      LOWER(country) LIKE ?
    )`);
    params.push(`%${countryNormalized}%`, `%${countryLower}%`, `%;${countryLower}%`);
  }

  // Journal - case and space insensitive matching
  if (filters.journal && filters.journal.trim()) {
    const journalNormalized = normalizeForSearch(filters.journal);
    // Match both normalized (no spaces) and original format
    conditions.push("(LOWER(REPLACE(journal, ' ', '')) = ? OR LOWER(journal) = LOWER(?))");
    params.push(journalNormalized, filters.journal.trim());
  }

  // Publisher - case and space insensitive matching
  if (filters.publisher && filters.publisher.trim()) {
    const publisherNormalized = normalizeForSearch(filters.publisher);
    // Match both normalized (no spaces) and original format
    conditions.push("(LOWER(REPLACE(publisher, ' ', '')) = ? OR LOWER(publisher) = LOWER(?))");
    params.push(publisherNormalized, filters.publisher.trim());
  }

  // Handle institution filtering with smart matching for Saveetha/SIMATS
  if (filters.institution && filters.institution.trim()) {
    const institutionLower = filters.institution.toLowerCase().trim();
    const institutionNormalized = normalizeForSearch(filters.institution);
    
    // Check if searching for Saveetha/SIMATS - expand to all variations
    if (isSaveethaSearch(institutionLower)) {
      conditions.push(`(
        LOWER(institution) LIKE '%saveetha%' OR 
        LOWER(institution) LIKE '%simats%' OR
        LOWER(institution) LIKE '%saveethaengineeringcollege%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%saveethaengineeringcollege%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%saveethaschoolofengineering%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%saveethainstituteofmedicalandtechnicalsciences%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%simatsuniversity%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%simatsdeemed%'
      )`);
    } else {
      // Regular search - case and space insensitive
      conditions.push("(LOWER(REPLACE(institution, ' ', '')) LIKE ? OR LOWER(institution) LIKE ?)");
      params.push(`%${institutionNormalized}%`, `%${institutionLower}%`);
    }
  } else if (filters.affiliation && filters.affiliation.trim()) {
    // Only use affiliation if institution is not provided
    const affiliationLower = filters.affiliation.toLowerCase().trim();
    const affiliationNormalized = normalizeForSearch(filters.affiliation);
    
    // Check if searching for Saveetha/SIMATS - expand to all variations
    if (isSaveethaSearch(affiliationLower)) {
      conditions.push(`(
        LOWER(institution) LIKE '%saveetha%' OR 
        LOWER(institution) LIKE '%simats%' OR
        LOWER(institution) LIKE '%saveethaengineeringcollege%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%saveethaengineeringcollege%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%saveethaschoolofengineering%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%saveethainstituteofmedicalandtechnicalsciences%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%simatsuniversity%' OR
        LOWER(REPLACE(institution, ' ', '')) LIKE '%simatsdeemed%'
      )`);
    } else {
      // Regular search - case and space insensitive
      conditions.push("(LOWER(REPLACE(institution, ' ', '')) LIKE ? OR LOWER(institution) LIKE ?)");
      params.push(`%${affiliationNormalized}%`, `%${affiliationLower}%`);
    }
  }

  if (filters.originalPaperFromDate || filters.originalPaperToDate) {
    if (filters.originalPaperFromDate && filters.originalPaperToDate) {
      conditions.push("(original_paper_date >= ? AND original_paper_date <= ?)");
      params.push(filters.originalPaperFromDate, filters.originalPaperToDate);
    } else if (filters.originalPaperFromDate) {
      conditions.push("original_paper_date >= ?");
      params.push(filters.originalPaperFromDate);
    } else if (filters.originalPaperToDate) {
      conditions.push("original_paper_date <= ?");
      params.push(filters.originalPaperToDate);
    }
  }

  // PubMed ID - case and space insensitive (remove spaces from search)
  if (filters.originalPaperPubMedID && filters.originalPaperPubMedID.trim()) {
    const pubmedNormalized = filters.originalPaperPubMedID.trim().replace(/\s+/g, '');
    conditions.push("(REPLACE(original_paper_pubmed_id, ' ', '') LIKE ? OR original_paper_pubmed_id LIKE ?)");
    params.push(`%${pubmedNormalized}%`, `%${filters.originalPaperPubMedID.trim()}%`);
  }

  // DOI search - case and space insensitive
  if (filters.originalPaperDOI && filters.originalPaperDOI.trim()) {
    const doiNormalized = normalizeForSearch(filters.originalPaperDOI);
    conditions.push("(LOWER(REPLACE(original_paper_doi, ' ', '')) LIKE ? OR LOWER(original_paper_doi) LIKE ?)");
    params.push(`%${doiNormalized}%`, `%${filters.originalPaperDOI.toLowerCase().trim()}%`);
  }

  if (filters.retractionFromDate || filters.retractionToDate) {
    if (filters.retractionFromDate && filters.retractionToDate) {
      conditions.push("(retraction_date >= ? AND retraction_date <= ?)");
      params.push(filters.retractionFromDate, filters.retractionToDate);
    } else if (filters.retractionFromDate) {
      conditions.push("retraction_date >= ?");
      params.push(filters.retractionFromDate);
    } else if (filters.retractionToDate) {
      conditions.push("retraction_date <= ?");
      params.push(filters.retractionToDate);
    }
  }

  // Retraction PubMed ID - case and space insensitive
  if (filters.retractionPubMedID && filters.retractionPubMedID.trim()) {
    const pubmedNormalized = filters.retractionPubMedID.trim().replace(/\s+/g, '');
    conditions.push("(REPLACE(retraction_pubmed_id, ' ', '') LIKE ? OR retraction_pubmed_id LIKE ?)");
    params.push(`%${pubmedNormalized}%`, `%${filters.retractionPubMedID.trim()}%`);
  }

  // Retraction DOI - case and space insensitive
  if (filters.retractionDOI && filters.retractionDOI.trim()) {
    const doiNormalized = normalizeForSearch(filters.retractionDOI);
    conditions.push("(LOWER(REPLACE(retraction_doi, ' ', '')) LIKE ? OR LOWER(retraction_doi) LIKE ?)");
    params.push(`%${doiNormalized}%`, `%${filters.retractionDOI.toLowerCase().trim()}%`);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

// Helper function to convert database row to API format
function rowToPaper(row) {
  return {
    'Record ID': row.record_id,
    'Title': row.title,
    'Subject': row.subject,
    'Institution': row.institution,
    'Journal': row.journal,
    'Publisher': row.publisher,
    'Country': row.country,
    'Author': row.author,
    'URLS': row.urls,
    'ArticleType': row.article_type,
    'RetractionDate': row.retraction_date,
    'RetractionDOI': row.retraction_doi,
    'RetractionPubMedID': row.retraction_pubmed_id,
    'OriginalPaperDate': row.original_paper_date,
    'OriginalPaperDOI': row.original_paper_doi,
    'OriginalPaperPubMedID': row.original_paper_pubmed_id,
    'RetractionNature': row.retraction_nature,
    'Reason': row.reason,
    'Paywalled': row.paywalled,
    'Notes': row.notes
  };
}

// API endpoint to get papers with pagination (for table display)
app.get('/api/papers', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 100;
    // Enforce maximum of 500 records per response (increased from 100)
    if (limit > 500) limit = 500;
    const offset = (page - 1) * limit;

    // Use cached prepared statement for count
    const total = preparedStatements.countAll.get().count;

    // Use cached prepared statement for data
    const rows = preparedStatements.getPapers.all(limit, offset);

    const results = rows.map(rowToPaper);

    res.json({
      count: total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      results
    });
  } catch (error) {
    console.error('Error getting papers:', error);
    res.status(500).json({ error: 'Failed to get papers' });
  }
});

// API endpoint to get unique values for dropdowns (with caching)
app.get('/api/options', (req, res) => {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (optionsCache && (now - optionsCacheTime) < OPTIONS_CACHE_TTL) {
      return res.json(optionsCache);
    }

    // Prepare statements if not cached
    if (!preparedStatements.getArticleTypes) {
      preparedStatements.getArticleTypes = db.prepare(`
        SELECT DISTINCT article_type 
        FROM papers 
        WHERE article_type IS NOT NULL AND article_type != ''
        ORDER BY article_type
      `);
      
      preparedStatements.getCountries = db.prepare(`
        SELECT DISTINCT country 
        FROM papers 
        WHERE country IS NOT NULL AND country != ''
        ORDER BY country
      `);
      
      preparedStatements.getJournals = db.prepare(`
        SELECT DISTINCT journal 
        FROM papers 
        WHERE journal IS NOT NULL AND journal != ''
        ORDER BY journal
      `);
      
      preparedStatements.getPublishers = db.prepare(`
        SELECT DISTINCT publisher 
        FROM papers 
        WHERE publisher IS NOT NULL AND publisher != ''
        ORDER BY publisher
      `);
    }

    // Execute queries in parallel (better-sqlite3 is synchronous, but we can optimize)
    const articleTypes = preparedStatements.getArticleTypes.all().map(r => r.article_type);

    const countries = preparedStatements.getCountries.all().flatMap(r => {
      // Split countries by semicolon and trim
      return (r.country || '').split(';').map(c => c.trim()).filter(Boolean);
    });
    const uniqueCountries = [...new Set(countries)].sort();

    const journals = preparedStatements.getJournals.all().map(r => r.journal);

    const publishers = preparedStatements.getPublishers.all().map(r => r.publisher);

    // Cache the result
    optionsCache = {
      articleTypes,
      countries: uniqueCountries,
      journals,
      publishers
    };
    optionsCacheTime = now;

    res.json(optionsCache);
  } catch (error) {
    console.error('Error getting options:', error);
    res.status(500).json({ error: 'Failed to get options' });
  }
});

// API endpoint to search/filter papers (optimized with prepared statement caching)
app.post('/api/search', (req, res) => {
  try {
    const {
      author,
      title,
      articleType,
      country,
      journal,
      publisher,
      affiliation,
      institution,
      originalPaperFromDate,
      originalPaperToDate,
      originalPaperPubMedID,
      originalPaperDOI,
      retractionFromDate,
      retractionToDate,
      retractionPubMedID,
      retractionDOI,
      page = 1,
      limit = 100
    } = req.body;

    const pageNum = parseInt(page);
    let limitNum = parseInt(limit);
    // Enforce maximum of 500 records per response (increased from 100)
    if (limitNum > 500) limitNum = 500;
    const offset = (pageNum - 1) * limitNum;

    // Clean and validate filters - remove empty strings and undefined values
    const cleanFilters = {
      author: author && typeof author === 'string' ? author.trim() : undefined,
      title: title && typeof title === 'string' ? title.trim() : undefined,
      articleType: articleType && typeof articleType === 'string' ? articleType.trim() : undefined,
      country: country && typeof country === 'string' ? country.trim() : undefined,
      journal: journal && typeof journal === 'string' ? journal.trim() : undefined,
      publisher: publisher && typeof publisher === 'string' ? publisher.trim() : undefined,
      affiliation: affiliation && typeof affiliation === 'string' ? affiliation.trim() : undefined,
      institution: institution && typeof institution === 'string' ? institution.trim() : undefined,
      originalPaperFromDate,
      originalPaperToDate,
      originalPaperPubMedID: originalPaperPubMedID && typeof originalPaperPubMedID === 'string' ? originalPaperPubMedID.trim() : undefined,
      originalPaperDOI: originalPaperDOI && typeof originalPaperDOI === 'string' ? originalPaperDOI.trim() : undefined,
      retractionFromDate,
      retractionToDate,
      retractionPubMedID: retractionPubMedID && typeof retractionPubMedID === 'string' ? retractionPubMedID.trim() : undefined,
      retractionDOI: retractionDOI && typeof retractionDOI === 'string' ? retractionDOI.trim() : undefined
    };

    // Remove undefined and empty string values
    Object.keys(cleanFilters).forEach(key => {
      if (cleanFilters[key] === undefined || cleanFilters[key] === '') {
        delete cleanFilters[key];
      }
    });

    // Build WHERE clause
    const { where, params } = buildWhereClause(cleanFilters);

    // Debug logging
    if (Object.keys(cleanFilters).length > 0) {
      console.log('Active filters:', Object.keys(cleanFilters));
      console.log('WHERE clause:', where);
    }

    // Prepare statements dynamically (SQLite handles this efficiently)
    // Note: We prepare fresh statements as WHERE clauses vary, but SQLite caches internally
    const countQuery = db.prepare(`SELECT COUNT(*) as count FROM papers ${where}`);
    const dataQuery = db.prepare(`
      SELECT * FROM papers 
      ${where}
      ORDER BY record_id 
      LIMIT ? OFFSET ?
    `);

    // Get total count
    const total = countQuery.get(...params).count;

    // Get paginated results
    const rows = dataQuery.all(...params, limitNum, offset);

    const results = rows.map(rowToPaper);

    res.json({
      count: total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      results
    });
  } catch (error) {
    console.error('Error searching papers:', error);
    res.status(500).json({ error: 'Failed to search papers' });
  }
});

// Health check endpoint (optimized)
app.get('/api/health', (req, res) => {
  try {
    const countResult = preparedStatements.countAll.get();
    res.json({ 
      status: 'ok', 
      papersLoaded: countResult.count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nClosing database connection...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
