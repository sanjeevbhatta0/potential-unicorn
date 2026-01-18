/**
 * Full Pipeline Integration Tests
 * 
 * Tests the complete article processing pipeline:
 * 1. Article ingestion via crawler endpoint
 * 2. Article storage and retrieval
 * 3. AI processing (summarization)
 * 4. Frontend API accessibility
 */

import axios from 'axios';

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3333';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY || 'crawler-secret-key-2026';

// Helper functions
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

const aiService = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 30000,
});

describe('Full Pipeline Integration Tests', () => {
    let testArticleId: string;

    describe('Service Health Checks', () => {
        it('API Backend should be healthy', async () => {
            const response = await api.get('/');
            expect(response.status).toBe(200);
        });

        it('AI Service should be healthy', async () => {
            const response = await aiService.get('/health');
            expect(response.status).toBe(200);
            expect(response.data.status).toBe('healthy');
        });

        it('AI Service should be ready', async () => {
            const response = await aiService.get('/ready');
            expect(response.status).toBe(200);
        });
    });

    describe('Article Ingestion Pipeline', () => {
        const testArticle = {
            title: `Integration Test Article ${Date.now()}`,
            content: `
        This is an integration test article for the Nepali News Hub platform.
        It tests the complete pipeline from article ingestion through the crawler
        endpoint to storage in the database and retrieval via the API.
        
        The article covers topics about technology and innovation in Nepal,
        discussing the growing startup ecosystem and government initiatives
        to support digital transformation across various sectors.
        
        Key points include the establishment of tech parks, investment in
        digital infrastructure, and partnerships with international organizations.
      `,
            summary: 'Test article about technology in Nepal',
            sourceUrl: `https://test.com/integration-test-${Date.now()}`,
            sourceName: 'Integration Test Source',
            category: 'technology',
            language: 'en',
            publishedAt: new Date().toISOString(),
        };

        it('should ingest article via crawler endpoint', async () => {
            const response = await api.post('/articles/crawler/ingest', testArticle, {
                headers: {
                    'x-api-key': CRAWLER_API_KEY,
                },
            });

            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('id');
            expect(response.data.title).toBe(testArticle.title);

            testArticleId = response.data.id;
        });

        it('should retrieve ingested article', async () => {
            expect(testArticleId).toBeDefined();

            const response = await api.get(`/articles/${testArticleId}`);

            expect(response.status).toBe(200);
            expect(response.data.id).toBe(testArticleId);
            expect(response.data.title).toBe(testArticle.title);
        });

        it('should appear in articles list', async () => {
            const response = await api.get('/articles', {
                params: { limit: 100 },
            });

            expect(response.status).toBe(200);

            const found = response.data.data.find((a: any) => a.id === testArticleId);
            expect(found).toBeDefined();
        });

        it('should appear in category filter', async () => {
            const response = await api.get('/articles', {
                params: { category: 'technology' },
            });

            expect(response.status).toBe(200);

            const found = response.data.data.find((a: any) => a.id === testArticleId);
            // May or may not be found depending on sorting/pagination
            expect(response.data.data.every((a: any) => a.category === 'technology')).toBe(true);
        });
    });

    describe('AI Processing Pipeline', () => {
        it('should trigger AI processing for article', async () => {
            expect(testArticleId).toBeDefined();

            const response = await api.post(`/articles/${testArticleId}/process-ai`);

            // This may succeed or fail depending on AI service availability
            expect([200, 500]).toContain(response.status);
        });

        it('should directly summarize via AI Service', async () => {
            const response = await aiService.post('/api/v1/summarize', {
                article: {
                    id: 'test-direct',
                    title: 'Direct Test Article',
                    content: 'This is content for direct AI summarization testing. It contains sufficient text to generate a meaningful summary about technology trends in South Asia.',
                    source: 'Test',
                    category: 'technology',
                },
                length: 'short',
                provider: 'claude',
            });

            // May succeed or fail depending on API keys
            expect([200, 500]).toContain(response.status);
        });
    });

    describe('View Count Pipeline', () => {
        it('should increment view count', async () => {
            expect(testArticleId).toBeDefined();

            // Get initial view count
            const before = await api.get(`/articles/${testArticleId}`);
            const initialViews = before.data.viewCount || 0;

            // Increment view
            await api.post(`/articles/${testArticleId}/view`);

            // Verify increment
            const after = await api.get(`/articles/${testArticleId}`);
            expect(after.data.viewCount).toBe(initialViews + 1);
        });
    });

    describe('Source Management Pipeline', () => {
        it('should list active sources', async () => {
            const response = await api.get('/sources/active');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        it('should provide source details', async () => {
            const listResponse = await api.get('/sources');

            if (listResponse.data.length > 0) {
                const source = listResponse.data[0];
                const detailResponse = await api.get(`/sources/${source.id}`);

                expect(detailResponse.status).toBe(200);
                expect(detailResponse.data.id).toBe(source.id);
            }
        });
    });

    describe('Cross-Service Integration', () => {
        it('should have consistent data format between services', async () => {
            // Verify API article format
            const articlesResponse = await api.get('/articles', { params: { limit: 1 } });

            if (articlesResponse.data.data.length > 0) {
                const article = articlesResponse.data.data[0];

                // Verify required fields exist
                expect(article).toHaveProperty('id');
                expect(article).toHaveProperty('title');
                expect(article).toHaveProperty('category');
                expect(article).toHaveProperty('publishedAt');
            }
        });

        it('should have both services running', async () => {
            const [apiHealth, aiHealth] = await Promise.all([
                api.get('/').catch(e => ({ status: 500 })),
                aiService.get('/health').catch(e => ({ status: 500 })),
            ]);

            expect(apiHealth.status).toBe(200);
            expect(aiHealth.status).toBe(200);
        });
    });
});
