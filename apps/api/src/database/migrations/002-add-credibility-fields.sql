-- Migration: Add credibility scoring fields to articles table

-- Add credibility-related columns to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS credibility_score DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS credibility_confidence DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS credibility_factors JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS similar_article_ids TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS fact_consistency_score DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_credibility_check TIMESTAMP DEFAULT NULL;

-- Add index for credibility queries
CREATE INDEX IF NOT EXISTS idx_articles_credibility_score ON articles(credibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_verification_status ON articles(verification_status);

-- Add source metadata to sources table
ALTER TABLE sources
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'mainstream',
ADD COLUMN IF NOT EXISTS bias VARCHAR(20) DEFAULT 'neutral',
ADD COLUMN IF NOT EXISTS credibility_rating DECIMAL(5,2) DEFAULT 75.0,
ADD COLUMN IF NOT EXISTS is_youtube_channel BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS youtube_channel_id VARCHAR(255) DEFAULT NULL;

-- Create table for cross-reference tracking
CREATE TABLE IF NOT EXISTS article_cross_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    similar_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    similarity_score DECIMAL(3,2) NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(article_id, similar_article_id)
);

CREATE INDEX IF NOT EXISTS idx_cross_ref_article ON article_cross_references(article_id);
CREATE INDEX IF NOT EXISTS idx_cross_ref_similarity ON article_cross_references(similarity_score DESC);

-- Create table for credibility history (for tracking changes over time)
CREATE TABLE IF NOT EXISTS credibility_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    factors JSONB NOT NULL,
    verification_status VARCHAR(50) NOT NULL,
    source_count INTEGER NOT NULL,
    checked_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credibility_history_article ON credibility_history(article_id, checked_at DESC);

-- Comments
COMMENT ON COLUMN articles.credibility_score IS 'Credibility score (0-100) based on cross-verification, source diversity, and AI fact-checking';
COMMENT ON COLUMN articles.verification_status IS 'Status: verified, credible, unverified, questionable';
COMMENT ON COLUMN articles.similar_article_ids IS 'IDs of articles covering the same story';
COMMENT ON COLUMN articles.source_count IS 'Number of sources covering this story';
COMMENT ON COLUMN articles.fact_consistency_score IS 'Score indicating fact consistency across sources (0-100)';

COMMENT ON TABLE article_cross_references IS 'Tracks similar articles for credibility scoring';
COMMENT ON TABLE credibility_history IS 'Historical credibility scores for tracking changes over time';
