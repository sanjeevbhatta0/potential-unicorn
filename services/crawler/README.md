# News Crawler Service

A robust TypeScript-based web crawler service for Nepali news websites. This service automatically crawls, processes, and queues news articles from multiple Nepali news sources.

## Features

- **Multi-Source Crawling**: Support for Online Khabar, eKantipur, and Setopati
- **Intelligent Processing**: Automatic content extraction, cleaning, and metadata generation
- **Duplicate Detection**: Redis-based deduplication to avoid processing the same articles
- **Queue Management**: Bull queue integration for reliable article processing
- **Rate Limiting**: Respectful crawling with configurable rate limits
- **Cron Scheduling**: Automated periodic crawling with customizable schedules
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Language Detection**: Automatic detection of Nepali, English, or mixed content
- **Extensible Architecture**: Easy to add new news sources

## Architecture

```
services/crawler/
├── src/
│   ├── crawlers/           # Crawler implementations
│   │   ├── base.crawler.ts
│   │   ├── onlinekhabar.crawler.ts
│   │   ├── ekantipur.crawler.ts
│   │   └── setopati.crawler.ts
│   ├── processors/         # Data processing
│   │   ├── article.processor.ts
│   │   └── deduplicator.ts
│   ├── queue/             # Queue management
│   │   └── producer.ts
│   ├── config/            # Configuration
│   │   └── sources.config.ts
│   ├── utils/             # Utilities
│   │   └── logger.ts
│   └── index.ts           # Main entry point
├── .env                   # Environment configuration
├── .env.example          # Environment template
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## Prerequisites

- Node.js (v18 or higher)
- Redis server
- TypeScript

## Installation

1. Clone the repository and navigate to the crawler service:

```bash
cd services/crawler
```

2. Install dependencies:

```bash
npm install
```

3. Install Playwright browsers:

```bash
npx playwright install chromium
```

4. Copy the environment template and configure:

```bash
cp .env.example .env
```

5. Edit `.env` with your configuration (see Configuration section below)

## Configuration

### Environment Variables

Key configuration options in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis server host | localhost |
| `REDIS_PORT` | Redis server port | 6379 |
| `CRAWL_INTERVAL` | Cron expression for crawl schedule | */30 * * * * |
| `REQUEST_TIMEOUT` | HTTP request timeout (ms) | 30000 |
| `RETRY_ATTEMPTS` | Number of retry attempts | 3 |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | info |
| `API_ENDPOINT` | API endpoint to send articles (optional) | - |

### Crawler Configuration

Edit `src/config/sources.config.ts` to:
- Enable/disable specific crawlers
- Adjust rate limits
- Update CSS selectors if websites change
- Configure pagination settings

## Usage

### Development Mode

Run with auto-reload:

```bash
npm run dev
```

### Production Mode

Build and run:

```bash
npm run build
npm start
```

### Single Run Mode

Run crawl once without scheduler:

```bash
npm run dev -- --once
# or
npm start -- --once
```

## Features in Detail

### 1. Crawlers

Each crawler extends the `BaseCrawler` class and implements:
- Article link extraction from listing pages
- Article content extraction with specific selectors
- Error handling and retry logic
- Rate limiting

### 2. Article Processing

The `ArticleProcessor` handles:
- Content cleaning and normalization
- Word count calculation
- Reading time estimation
- Language detection (Nepali/English/Mixed)
- Summary generation
- Article validation

### 3. Deduplication

The `Deduplicator` uses Redis to detect duplicates by:
- URL comparison
- Title similarity (Jaccard similarity)
- Content similarity
- Configurable thresholds

### 4. Queue Management

Bull queue features:
- Job prioritization based on article freshness
- Automatic retries with exponential backoff
- Job monitoring and statistics
- Configurable concurrency

### 5. Logging

Winston-based logging with:
- Console and file output
- Log rotation
- Structured logging with metadata
- Configurable log levels

## Adding a New News Source

1. Create a new crawler class in `src/crawlers/`:

```typescript
import { BaseCrawler } from './base.crawler';
import { crawlerConfigs } from '../config/sources.config';

export class NewSourceCrawler extends BaseCrawler {
  constructor() {
    super(crawlerConfigs.newsource);
  }

  // Override methods if needed for custom extraction
}
```

2. Add configuration in `src/config/sources.config.ts`:

```typescript
newsource: {
  name: 'New Source',
  baseUrl: 'https://newsource.com',
  enabled: true,
  selectors: {
    articleList: '.article',
    articleLink: 'a',
    title: 'h1',
    content: '.content p',
    // ... other selectors
  },
  rateLimit: {
    requestsPerMinute: 10,
    delayBetweenRequests: 6000
  }
}
```

3. Register in `src/index.ts`:

```typescript
import { NewSourceCrawler } from './crawlers/newsource.crawler';

// In initializeCrawlers():
if (crawlerConfigs.newsource.enabled) {
  this.crawlers.push(new NewSourceCrawler());
}
```

## Monitoring

### Queue Statistics

The service logs queue statistics after each crawl:
- Waiting jobs
- Active jobs
- Completed jobs
- Failed jobs
- Delayed jobs

### Logs

Logs are stored in:
- `./logs/crawler.log` - All logs
- `./logs/error.log` - Error logs only

## Error Handling

The service includes:
- Automatic retries for failed requests
- Graceful degradation if one source fails
- Comprehensive error logging
- Graceful shutdown handling

## Performance Considerations

- **Rate Limiting**: Configured to be respectful of source websites
- **Concurrency**: Crawlers run sequentially by default to avoid overload
- **Memory**: Processes articles in batches
- **Redis**: Uses TTL for automatic cleanup of old data

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Start Redis (Linux)
sudo systemctl start redis

# Start Redis (macOS)
brew services start redis
```

### Playwright Browser Issues

```bash
# Reinstall browsers
npx playwright install --force chromium
```

### Selector Issues

If articles aren't being extracted:
1. Check if website structure changed
2. Update selectors in `src/config/sources.config.ts`
3. Test with `--once` flag to see logs

## Contributing

To add features or fix bugs:

1. Follow the existing code structure
2. Add appropriate error handling
3. Update TypeScript types
4. Test with `--once` mode first
5. Update documentation

## License

MIT

## Support

For issues or questions, please check the logs first at `./logs/crawler.log` for detailed error messages.
