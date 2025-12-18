# Retraction Watch Server

Backend server for the Research Paper Retraction Database using SQLite.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

Before starting the server, you need to initialize the SQLite database by importing the CSV data:

```bash
npm run init-db
```

This will:
- Create the `papers.db` SQLite database
- Create the table structure with all columns
- Create indexes on commonly filtered columns for fast queries
- Import all records from the CSV file

**Note:** This may take a few minutes for large CSV files (70,000+ records).

### 3. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## Database Structure

The database uses SQLite with the following optimizations:

- **Indexes** on commonly filtered columns:
  - author
  - title
  - journal
  - publisher
  - country
  - article_type
  - institution
  - dates (original_paper_date, retraction_date)
  - DOIs and PubMed IDs

- **WAL Mode** enabled for better concurrency

## Performance

With SQLite and proper indexing:
- **Fast queries**: Indexed columns allow sub-second search times
- **Efficient filtering**: Database handles filtering instead of in-memory arrays
- **Scalable**: Can handle millions of records efficiently
- **Low memory**: Only loads queried data, not entire dataset

## API Endpoints

- `GET /api/health` - Health check and paper count
- `GET /api/papers?page=1&limit=20` - Get paginated papers
- `GET /api/options` - Get unique values for dropdowns
- `POST /api/search` - Search/filter papers with pagination

## Troubleshooting

If you get "database not found" errors:
1. Make sure you've run `npm run init-db` first
2. Check that `papers.db` exists in the `server/` directory
3. Verify the CSV file path is correct

To reinitialize the database:
1. Delete `papers.db` (and `papers.db-wal`, `papers.db-shm` if they exist)
2. Run `npm run init-db` again



