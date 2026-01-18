import 'dotenv/config';
import { DataSource } from 'typeorm';
import { NewsSourceEntity } from './entities/source.entity';

/**
 * Database seed script for news sources
 * Run with: npx ts-node src/database/seed-sources.ts
 */

const defaultSources = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Online Khabar',
    type: 'website' as const,
    baseUrl: 'https://www.onlinekhabar.com',
    language: 'ne' as const,
    isActive: true,
    crawlConfig: {
      enabled: true,
      interval: 30,
      maxArticles: 50,
      selectors: {
        article: 'a[href*="/news/"], a[href*="/2024/"], a[href*="/2025/"], a[href*="/2026/"]',
        title: 'h1',
        content: '.ok-news-post-content-wrap, .post__content, article',
        image: 'meta[property="og:image"]',
        author: '.author-name, .post__author',
        date: 'time, .post__date',
      },
    },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'eKantipur',
    type: 'website' as const,
    baseUrl: 'https://ekantipur.com',
    language: 'ne' as const,
    isActive: true,
    crawlConfig: {
      enabled: true,
      interval: 30,
      maxArticles: 50,
      selectors: {
        article: 'a[href*="/news/"], a[href*="/koseli/"], a[href*="/sports/"]',
        title: 'h1',
        content: '.description, .story-content, article',
        image: 'meta[property="og:image"]',
        author: '.author, .reporter-name',
        date: 'time, .date',
      },
    },
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Setopati',
    type: 'website' as const,
    baseUrl: 'https://www.setopati.com',
    language: 'ne' as const,
    isActive: true,
    crawlConfig: {
      enabled: true,
      interval: 30,
      maxArticles: 50,
      selectors: {
        article: 'a[href*="/news/"], a[href*="/political/"], a[href*="/social/"]',
        title: 'h1',
        content: '.news-content, .main-content, article',
        image: 'meta[property="og:image"]',
        author: '.author, .reporter',
        date: 'time, .date',
      },
    },
  },
];

async function seedSources() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'nepali_news_hub',
    entities: [NewsSourceEntity],
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const sourceRepository = dataSource.getRepository(NewsSourceEntity);

    for (const sourceData of defaultSources) {
      // Check if source already exists
      const existing = await sourceRepository.findOne({
        where: { id: sourceData.id },
      });

      if (existing) {
        // Update existing source with new crawlConfig
        await sourceRepository.update(sourceData.id, {
          ...sourceData,
          crawlConfig: sourceData.crawlConfig,
        });
        console.log(`Updated source: ${sourceData.name}`);
      } else {
        // Create new source
        const source = sourceRepository.create(sourceData);
        await sourceRepository.save(source);
        console.log(`Created source: ${sourceData.name}`);
      }
    }

    console.log('\nSeed completed successfully!');
    console.log('Sources in database:');

    const allSources = await sourceRepository.find();
    for (const source of allSources) {
      console.log(`  - ${source.name} (${source.id})`);
      console.log(`    Active: ${source.isActive}`);
      console.log(`    Crawl Enabled: ${source.crawlConfig?.enabled}`);
    }
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

seedSources();
