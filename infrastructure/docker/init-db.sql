-- Initialize PostgreSQL with required extensions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable btree_gin for better indexing
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Create application user (optional, can be done later)
-- CREATE USER nepali_news_app WITH PASSWORD 'app_password';
-- GRANT ALL PRIVILEGES ON DATABASE nepali_news_dev TO nepali_news_app;

COMMENT ON EXTENSION "uuid-ossp" IS 'Generate UUIDs';
COMMENT ON EXTENSION vector IS 'Vector similarity search';
COMMENT ON EXTENSION pg_trgm IS 'Fuzzy text matching';
COMMENT ON EXTENSION btree_gin IS 'Improved indexing for GIN';
