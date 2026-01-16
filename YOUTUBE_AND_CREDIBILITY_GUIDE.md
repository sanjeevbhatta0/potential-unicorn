# YouTube Integration & Credibility Scoring Guide

## 🎯 Overview

This guide explains the **YouTube integration** for independent Nepali media and the **Credibility Scoring System** - two powerful features that make your news aggregator truly unique and unbiased.

---

## 📺 YouTube Integration

### What It Does

Automatically crawls and aggregates news content from:
- **Independent News Channels**: Indepth Story, The Nepali Comment, Sushant Pradhan, etc.
- **Mainstream TV Channels**: Kantipur TV, Setopati Online, AP1 HD, etc.
- **International News**: BBC Nepali, VOA Nepali

### Features

✅ **Video Metadata Extraction**
- Title, description, publish date
- View count, likes, comments
- Thumbnail images
- Duration and tags

✅ **Transcript Extraction**
- Automatic caption/subtitle extraction (Nepali & English)
- Converts video content to searchable text
- Enables AI summarization of video content

✅ **Smart Filtering**
- Automatically filters out non-news content
- Detects news vs entertainment/music/vlogs
- Category detection (politics, economy, sports, etc.)

✅ **Source Diversity**
- Tracks source type (independent/mainstream/international)
- Monitors political bias (left/center/right/neutral)
- Base credibility scores for each channel

### Supported YouTube Channels

**Independent Media (7 channels):**
1. **Indepth Story** - Investigation & Analysis (Score: 85)
2. **The Nepali Comment** - Political Commentary (Score: 82)
3. **Sushant Pradhan** - Analysis & Interviews (Score: 88)
4. **Nepali Khabar** - Current Affairs (Score: 78)
5. **Himal Khabar** - News & Politics (Score: 75)
6. **Nepal Aaja** - News Discussion (Score: 80)

**Mainstream TV (5 channels):**
7. **Kantipur TV HD** (Score: 82)
8. **Setopati Online** (Score: 85)
9. **AP1 HD Television** (Score: 78)
10. **News24 Nepal** (Score: 75)
11. **Online Khabar** (Score: 83)

**International (2 channels):**
12. **BBC News Nepali** (Score: 92)
13. **VOA Nepali** (Score: 88)

### Configuration

Edit `/services/crawler/src/config/youtube-channels.config.ts` to:
- Add more channels
- Update credibility ratings
- Change crawl settings
- Adjust bias classifications

### YouTube API Setup

**Get YouTube API Key:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable "YouTube Data API v3"
4. Create credentials (API key)
5. Add to `.env`:

```env
YOUTUBE_API_KEY=your-youtube-api-key-here
```

**API Quotas:**
- Free tier: 10,000 units/day
- Each video fetch: ~3 units
- Can fetch ~3,000 videos/day

---

## 🎖️ Credibility Scoring System

### What It Does

Calculates an **objective credibility score (0-100)** for every news article based on multiple factors, helping readers identify trustworthy news.

### How It Works

The system analyzes 5 key factors:

#### 1. **Cross-Coverage (30% weight)**
How many sources report the same story?

- **1 source**: 40/100 (single source, no verification)
- **2 sources**: 60/100 (some verification)
- **3 sources**: 75/100 (good coverage)
- **4 sources**: 85/100 (excellent coverage)
- **5+ sources**: 95/100 (widely reported)

#### 2. **Source Diversity (20% weight)**
Mix of different types of sources:

- **Type Diversity**: Mainstream + Independent + International
- **Bias Diversity**: Left + Center + Right + Neutral
- **Higher diversity** = More objective coverage

#### 3. **Source Reputation (20% weight)**
Historical accuracy and credibility of sources:

- Each source has a base credibility score (0-100)
- BBC Nepali: 92, Indepth Story: 85, etc.
- Average reputation of all sources covering the story

#### 4. **Fact Consistency (15% weight)**
Agreement on key facts across sources:

- AI extracts key facts (names, dates, numbers, events)
- Compares facts across all articles
- **High consistency** = Facts match across sources
- **Low consistency** = Conflicting information

#### 5. **AI Verification (15% weight)**
AI-powered fact checking:

- Analyzes content for objectivity
- Detects bias and sensationalism
- Checks if sources are cited
- Verifies information is factual

### Credibility Badges

**🟢 Verified (90-100)**
- Multiple sources confirm the story
- Facts consistent across sources
- Reputable sources
- AI verification passed
- ✓ Safe to trust and share

**🔵 Credible (70-89)**
- Covered by reputable sources
- Good source diversity
- Facts mostly consistent
- ✓ Generally trustworthy

**🟡 Unverified (50-69)**
- Limited cross-verification
- Single or few sources
- Cannot confirm facts
- ! Use caution

**🔴 Questionable (0-49)**
- Single unverified source
- High bias detected
- Conflicting information
- ⚠ Verify before sharing

### Visual Indicators

**In Article Cards:**
```
┌─────────────────────────────────┐
│ 📰 Article Title               │
│                                 │
│ [✓ Verified 92]  [5 sources]  │
└─────────────────────────────────┘
```

**In Article Detail:**
```
┌─────────────────────────────────────┐
│ Credibility Score                   │
│ ┌─────────────────────────────────┐ │
│ │ ✓  Verified          Score: 92 │ │
│ │ Covered by 5 sources • diverse │ │
│ │ source types • facts verified  │ │
│ │                                │ │
│ │ Sources: 5         Diversity: 85%│ │
│ │ Fact Check: 92%   Confidence: 95%│ │
│ │                                │ │
│ │ Score Factors:                 │ │
│ │ Cross coverage:  ████████ 95   │ │
│ │ Source diversity:█████▓▒░ 85   │ │
│ │ Source reputation:████████ 90  │ │
│ │ Fact consistency:████████ 92   │ │
│ │ AI verification: ███████▓ 88   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Database Schema

New fields in `articles` table:
```sql
credibility_score        DECIMAL(5,2)  -- 0-100
credibility_confidence   DECIMAL(3,2)  -- 0-1
credibility_factors      JSONB         -- Factor breakdown
verification_status      VARCHAR(50)   -- verified/credible/unverified/questionable
similar_article_ids      TEXT[]        -- Related articles
source_count             INTEGER       -- Number of sources
fact_consistency_score   DECIMAL(5,2)  -- 0-100
last_credibility_check   TIMESTAMP     -- Last scored
```

New tables:
- `article_cross_references` - Tracks similar articles
- `credibility_history` - Historical scores over time

### API Endpoints

**Calculate Single Article:**
```bash
POST /api/v1/credibility/calculate
{
  "article": {
    "id": "abc123",
    "title": "Article title...",
    "content": "Article content...",
    "source_name": "Indepth Story",
    "source_type": "independent",
    "source_bias": "neutral",
    "source_credibility": 85,
    "published_at": "2026-01-15T10:00:00Z",
    "category": "politics"
  },
  "related_articles": [...]
}
```

**Response:**
```json
{
  "article_id": "abc123",
  "score": 92.5,
  "confidence": 0.95,
  "factors": {
    "cross_coverage": 95,
    "source_diversity": 85,
    "source_reputation": 90,
    "fact_consistency": 92,
    "ai_verification": 88
  },
  "similar_articles": ["def456", "ghi789"],
  "source_count": 5,
  "verification_status": "verified",
  "explanation": "Covered by 5 sources • diverse source types • reputable sources • facts verified",
  "badge_color": "green",
  "badge_text": "Verified"
}
```

**Batch Scoring:**
```bash
POST /api/v1/credibility/batch
{
  "articles": [...]
}
```

---

## 🔄 How It Works Together

### Workflow

1. **Crawlers fetch content**
   - Web scrapers: Online Khabar, eKantipur, Setopati
   - YouTube crawler: Indepth Story, Sushant Pradhan, etc.

2. **AI processing**
   - Extract transcripts from YouTube videos
   - Summarize content
   - Translate if needed

3. **Cross-reference detection**
   - Calculate embeddings for each article
   - Find similar articles (same story, different sources)
   - Group articles by topic

4. **Credibility scoring**
   - Count sources covering the story
   - Calculate source diversity
   - Extract and compare facts
   - AI verification
   - Calculate final score (0-100)

5. **Display in UI**
   - Show credibility badge
   - Display source count
   - Show detailed breakdown on article detail page

### Example: Breaking News Story

**Scenario:** Prime Minister announces new policy

**Step 1 - Coverage:**
- Kantipur TV posts video → YouTube crawler fetches
- Online Khabar publishes article → Web crawler fetches
- Indepth Story analyzes in video → YouTube crawler fetches
- BBC Nepali reports → YouTube crawler fetches
- Setopati covers → Web crawler fetches

**Step 2 - Detection:**
- AI detects all 5 articles are about the same story
- Calculates similarity score > 0.75 for each pair

**Step 3 - Scoring:**
- Cross-coverage: 95/100 (5 sources)
- Source diversity: 90/100 (mainstream + independent + international)
- Source reputation: 87/100 (avg of 82, 83, 85, 92, 85)
- Fact consistency: 94/100 (key facts match)
- AI verification: 90/100 (factual, objective)

**Final Score: 92/100 ✓ Verified**

**Display:**
```
🟢 Verified - 92
5 sources: Kantipur TV, Online Khabar, Indepth Story, BBC Nepali, Setopati
Covered by diverse source types • facts verified across sources
```

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
# AI Service (already has openai, anthropic)
cd services/ai-service
poetry add googleapis-common-protos

# Crawler Service
cd services/crawler
pnpm add googleapis youtube-transcript
```

### Step 2: Get API Keys

**YouTube Data API:**
1. https://console.cloud.google.com/
2. Enable YouTube Data API v3
3. Create API key

**Already have:**
- OpenAI API (for embeddings)
- Anthropic API (for fact-checking)

### Step 3: Update Environment Variables

```bash
# Add to .env
YOUTUBE_API_KEY=your-youtube-api-key-here
```

### Step 4: Run Database Migration

```bash
cd apps/api
# Run migration to add credibility fields
psql -h localhost -U postgres -d nepali_news_dev -f src/database/migrations/002-add-credibility-fields.sql
```

### Step 5: Register API Endpoint

Update `/services/ai-service/app/main.py`:

```python
from app.api.v1 import credibility

app.include_router(credibility.router, prefix="/api")
```

### Step 6: Test YouTube Crawler

```bash
cd services/crawler
pnpm dev -- --source youtube --once
```

### Step 7: Test Credibility Scoring

```bash
curl -X POST http://localhost:8000/api/v1/credibility/calculate \
  -H "Content-Type: application/json" \
  -d @test-article.json
```

---

## 📊 Benefits

### For Users

✅ **Unbiased News** - See multiple perspectives
✅ **Trust Indicators** - Know what's verified
✅ **Source Diversity** - Independent + mainstream coverage
✅ **Fact-Checked** - AI-verified information
✅ **Time-Saving** - Quick credibility at a glance

### For Your Platform

✅ **Unique Selling Point** - Only Nepali news aggregator with credibility scoring
✅ **User Trust** - Build reputation for unbiased news
✅ **Engagement** - Users stay longer to read verified content
✅ **Share-Worthy** - People share credible news
✅ **Monetization** - Premium feature for businesses/journalists

---

## 🎨 UI Integration

### Article Card Component

```tsx
import { CredibilityBadge, SourceCountBadge } from '@/components/features/articles/CredibilityBadge';

<ArticleCard>
  <h3>{article.title}</h3>
  <div className="flex gap-2">
    <CredibilityBadge score={article.credibilityScore} variant="compact" />
    <SourceCountBadge count={article.sourceCount} />
  </div>
</ArticleCard>
```

### Article Detail Page

```tsx
<CredibilityBadge
  score={article.credibilityScore}
  variant="detailed"
/>
```

---

## 🔮 Future Enhancements

### Phase 2
- [ ] Real-time credibility updates
- [ ] User-reported verification
- [ ] Journalist fact-checking integration
- [ ] Blockchain-based verification trail

### Phase 3
- [ ] Chrome extension for credibility check
- [ ] Mobile app push notifications for verified news
- [ ] API for third-party integration
- [ ] Premium credibility insights dashboard

---

## 📞 Support

For issues or questions:
- Check logs in `/services/crawler/logs/`
- Check AI service logs
- Review YouTube API quota usage
- Test credibility scoring with sample data

---

## 🎉 Summary

You now have:

✅ **YouTube integration** for 14 Nepali news channels
✅ **Transcript extraction** for video content
✅ **Credibility scoring** system (0-100)
✅ **Cross-reference detection** using AI embeddings
✅ **Fact-checking** with Claude AI
✅ **Visual badges** for credibility display
✅ **Database schema** for credibility tracking
✅ **API endpoints** for scoring
✅ **UI components** for beautiful display

**This is a game-changer for Nepali news consumption!** 🇳🇵✨

Your platform now provides what no other Nepali news site offers: **objective, AI-verified credibility scoring across diverse sources including YouTube independent media.**
