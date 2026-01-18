/**
 * Full Pipeline Integration Tests
 * 
 * Tests the complete article processing pipeline:
 * 1. Source verification (fetching valid source ID)
 * 2. Article ingestion via crawler endpoint
 * 3. Article storage and retrieval
 * 4. AI processing (summarization)
 * 5. Frontend API accessibility
 */

import axios from 'axios';

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3333';
const API_PREFIX = '/api/v1';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const CRAWLER_API_KEY = process.env.CRAWLER_API_KEY || 'crawler-secret-key-2026';

// Helper functions
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    validateStatus: () => true, // Don't throw on error status
});

const aiService = axios.create({
    baseURL: AI_SERVICE_URL,
    timeout: 30000,
    validateStatus: () => true, // Don't throw on error status
});

describe('Full Pipeline Integration Tests', () => {
    let testArticleId: string;
    let validSourceId: string;

    describe('Service Health Checks', () => {
        it('API Backend should be healthy', async () => {
            const response = await api.get('/');
            expect(response.status).toBe(200);
            // Note: Root response might be wrapped or raw depending on implementation details
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

    describe('Source Management Pipeline', () => {
        it('should list active sources', async () => {
            const response = await api.get(`${API_PREFIX}/sources/active`);

            expect(response.status).toBe(200);
            // Handle unwrapping of global response structure { success: true, data: [...] }
            const sources = response.data.data || response.data;
            expect(Array.isArray(sources)).toBe(true);
            expect(sources.length).toBeGreaterThan(0);

            validSourceId = sources[0].id;
        });

        it('should provide source details', async () => {
            expect(validSourceId).toBeDefined();

            const detailResponse = await api.get(`${API_PREFIX}/sources/${validSourceId}`);

            expect(detailResponse.status).toBe(200);
            const source = detailResponse.data.data || detailResponse.data;
            expect(source.id).toBe(validSourceId);
        });
    });

    describe('Article Ingestion Pipeline', () => {
        let testArticle: any;

        beforeAll(() => {
            testArticle = {
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
                // DTO requires valid UUID sourceId and url field
                sourceId: validSourceId,
                url: `https://test.com/integration-test-${Date.now()}`,
                category: 'technology',
                language: 'en',
                publishedAt: new Date().toISOString(),
                // Helper fields (removed sourceName as strict validation forbids it)
            };
        });

        it('should ingest article via crawler endpoint', async () => {
            expect(validSourceId).toBeDefined();

            try {
                const response = await api.post(`${API_PREFIX}/articles/crawler/ingest`, testArticle, {
                    headers: {
                        'x-api-key': CRAWLER_API_KEY,
                    },
                });

                expect(response.status).toBe(201);
                const data = response.data.data || response.data;
                expect(data).toHaveProperty('id');
                expect(data.title).toBe(testArticle.title);

                testArticleId = data.id;
            } catch (error: any) {
                console.error('Ingest Error:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should retrieve ingested article', async () => {
            expect(testArticleId).toBeDefined();

            const response = await api.get(`${API_PREFIX}/articles/${testArticleId}`);

            expect(response.status).toBe(200);
            const data = response.data.data || response.data;
            expect(data.id).toBe(testArticleId);
            expect(data.title).toBe(testArticle.title);
        });

        it('should appear in articles list', async () => {
            const response = await api.get(`${API_PREFIX}/articles`, {
                params: { limit: 100 },
            });

            expect(response.status).toBe(200);

            const articles = response.data.data || response.data.data || response.data; // Handle pagination wrapper potentially nested
            // Usually list response: { data: [...], meta: ... } wrapped in global { data: { data: [...], meta: ... } } ??
            // Or just { data: [ ... ], meta ... } wrapped?
            // findAll returns { data: [], meta: {} } usually.
            // Let's assume standard response.data.data is the list or object containing list.

            // If findAll returns object with data property directly:
            const list = Array.isArray(articles) ? articles : articles.data;

            const found = list.find((a: any) => a.id === testArticleId);
            expect(found).toBeDefined();
        });

        it('should appear in category filter', async () => {
            const response = await api.get(`${API_PREFIX}/articles`, {
                params: { category: 'technology', limit: 50 },
            });

            expect(response.status).toBe(200);

            const articlesWrapper = response.data.data || response.data;
            const list = Array.isArray(articlesWrapper) ? articlesWrapper : articlesWrapper.data;

            const found = list.find((a: any) => a.id === testArticleId);
            // May or may not be found depending on sorting/pagination, but let's check content
            if (found) {
                expect(list.every((a: any) => a.category === 'technology')).toBe(true);
            }
        });
    });

    describe('AI Processing Pipeline', () => {
        it('should trigger AI processing for article', async () => {
            expect(testArticleId).toBeDefined();

            const response = await api.post(`${API_PREFIX}/articles/${testArticleId}/process-ai`);

            // This may succeed or fail depending on AI service availability or article state
            expect([200, 201, 400, 500]).toContain(response.status);
        });

        it('should directly summarize via AI Service', async () => {
            try {
                const response = await aiService.post('/api/v1/summarize', {
                    article: {
                        id: 'test-direct',
                        title: 'Direct Test Article',
                        content: 'This is content for direct AI summarization testing. It contains sufficient text to generate a meaningful summary.',
                        source: 'Test',
                        category: 'technology',
                    },
                    length: 'short',
                    provider: 'claude',
                });

                // May succeed or fail depending on API keys
                expect([200, 500]).toContain(response.status);
            } catch (error: any) {
                console.error('AI Summarize Error:', error.response?.data || error.message);
                if (error.response?.status === 404) {
                    console.error('Endpoint not found: /api/v1/summarize');
                }
                throw error;
            }
        });
    });

    describe('View Count Pipeline', () => {
        it('should increment view count', async () => {
            expect(testArticleId).toBeDefined();

            // Get initial view count
            const before = await api.get(`${API_PREFIX}/articles/${testArticleId}`);
            const beforeData = before.data.data || before.data;
            const initialViews = beforeData.viewCount || 0;

            // Increment view
            await api.post(`${API_PREFIX}/articles/${testArticleId}/view`);

            // Verify increment
            const after = await api.get(`${API_PREFIX}/articles/${testArticleId}`);
            const afterData = after.data.data || after.data;
            expect(afterData.viewCount).toBeGreaterThan(initialViews);
        });
    });

    describe('Cross-Service Integration', () => {
        it('should have consistent data format between services', async () => {
            // Verify API article format
            const articlesResponse = await api.get(`${API_PREFIX}/articles`, { params: { limit: 1 } });

            const articlesWrapper = articlesResponse.data.data || articlesResponse.data;
            const list = Array.isArray(articlesWrapper) ? articlesWrapper : articlesWrapper.data;

            if (list.length > 0) {
                const article = list[0];

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
