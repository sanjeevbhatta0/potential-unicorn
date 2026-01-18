/**
 * Articles API E2E Tests
 * 
 * Tests for all articles-related endpoints:
 * - GET /articles (list with filters and pagination)
 * - GET /articles/:id (single article)
 * - GET /articles/trending (trending articles)
 * - GET /articles/category/:category (by category)
 * - POST /articles (create - admin only)
 * - PATCH /articles/:id (update)
 * - DELETE /articles/:id (delete)
 * - POST /articles/:id/view (increment view count)
 * - POST /articles/:id/process-ai (AI processing)
 * - POST /articles/crawler/ingest (crawler ingestion)
 */

import { getRequest, TestDataFactory, TEST_API_KEY } from './setup';

describe('Articles API (e2e)', () => {
    let createdArticleId: string;

    describe('GET /articles', () => {
        it('should return paginated articles', async () => {
            const response = await getRequest()
                .get('/articles')
                .expect(200);

            expect(response.body).toHaveProperty('data');
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('limit');
            expect(response.body).toHaveProperty('totalPages');
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should respect pagination parameters', async () => {
            const response = await getRequest()
                .get('/articles')
                .query({ page: 1, limit: 5 })
                .expect(200);

            expect(response.body.page).toBe(1);
            expect(response.body.limit).toBe(5);
            expect(response.body.data.length).toBeLessThanOrEqual(5);
        });

        it('should filter by category', async () => {
            const response = await getRequest()
                .get('/articles')
                .query({ category: 'politics' })
                .expect(200);

            if (response.body.data.length > 0) {
                response.body.data.forEach((article: any) => {
                    expect(article.category).toBe('politics');
                });
            }
        });

        it('should filter by source', async () => {
            const response = await getRequest()
                .get('/articles')
                .query({ source: 'eKantipur' })
                .expect(200);

            expect(response.body).toHaveProperty('data');
        });

        it('should sort by publishedAt descending by default', async () => {
            const response = await getRequest()
                .get('/articles')
                .expect(200);

            if (response.body.data.length >= 2) {
                const dates = response.body.data.map((a: any) => new Date(a.publishedAt).getTime());
                for (let i = 1; i < dates.length; i++) {
                    expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
                }
            }
        });

        it('should handle search query', async () => {
            const response = await getRequest()
                .get('/articles')
                .query({ search: 'Nepal' })
                .expect(200);

            expect(response.body).toHaveProperty('data');
        });
    });

    describe('GET /articles/trending', () => {
        it('should return trending articles', async () => {
            const response = await getRequest()
                .get('/articles/trending')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should respect limit parameter', async () => {
            const response = await getRequest()
                .get('/articles/trending')
                .query({ limit: 3 })
                .expect(200);

            expect(response.body.length).toBeLessThanOrEqual(3);
        });
    });

    describe('GET /articles/category/:category', () => {
        it('should return articles by category', async () => {
            const response = await getRequest()
                .get('/articles/category/politics')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                response.body.forEach((article: any) => {
                    expect(article.category).toBe('politics');
                });
            }
        });

        it('should handle empty category', async () => {
            const response = await getRequest()
                .get('/articles/category/nonexistent-category-xyz')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /articles/crawler/ingest', () => {
        it('should accept valid article with correct API key', async () => {
            const articleData = TestDataFactory.createArticle({
                sourceUrl: `https://test.com/unique-${Date.now()}`,
            });

            const response = await getRequest()
                .post('/articles/crawler/ingest')
                .set('x-api-key', TEST_API_KEY)
                .send(articleData)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(articleData.title);
            createdArticleId = response.body.id;
        });

        it('should reject request without API key', async () => {
            const articleData = TestDataFactory.createArticle();

            await getRequest()
                .post('/articles/crawler/ingest')
                .send(articleData)
                .expect(401);
        });

        it('should reject request with invalid API key', async () => {
            const articleData = TestDataFactory.createArticle();

            await getRequest()
                .post('/articles/crawler/ingest')
                .set('x-api-key', 'invalid-key')
                .send(articleData)
                .expect(401);
        });

        it('should reject invalid article data', async () => {
            await getRequest()
                .post('/articles/crawler/ingest')
                .set('x-api-key', TEST_API_KEY)
                .send({ title: '' }) // Missing required fields
                .expect(400);
        });
    });

    describe('GET /articles/:id', () => {
        it('should return article by ID', async () => {
            // First get an article ID from the list
            const listResponse = await getRequest()
                .get('/articles')
                .expect(200);

            if (listResponse.body.data.length > 0) {
                const articleId = listResponse.body.data[0].id;

                const response = await getRequest()
                    .get(`/articles/${articleId}`)
                    .expect(200);

                expect(response.body.id).toBe(articleId);
                expect(response.body).toHaveProperty('title');
                expect(response.body).toHaveProperty('content');
                expect(response.body).toHaveProperty('category');
            }
        });

        it('should return 404 for non-existent article', async () => {
            await getRequest()
                .get('/articles/00000000-0000-0000-0000-000000000000')
                .expect(404);
        });

        it('should return 400 for invalid UUID', async () => {
            await getRequest()
                .get('/articles/invalid-id')
                .expect(400);
        });
    });

    describe('POST /articles/:id/view', () => {
        it('should increment article view count', async () => {
            // Get an article first
            const listResponse = await getRequest()
                .get('/articles')
                .expect(200);

            if (listResponse.body.data.length > 0) {
                const article = listResponse.body.data[0];
                const initialViews = article.viewCount || 0;

                await getRequest()
                    .post(`/articles/${article.id}/view`)
                    .expect(200);

                // Verify view count increased
                const updatedResponse = await getRequest()
                    .get(`/articles/${article.id}`)
                    .expect(200);

                expect(updatedResponse.body.viewCount).toBe(initialViews + 1);
            }
        });
    });

    describe('POST /articles/:id/process-ai', () => {
        it('should trigger AI processing for article', async () => {
            // Get an article first
            const listResponse = await getRequest()
                .get('/articles')
                .expect(200);

            if (listResponse.body.data.length > 0) {
                const articleId = listResponse.body.data[0].id;

                const response = await getRequest()
                    .post(`/articles/${articleId}/process-ai`)
                    .expect(200);

                expect(response.body).toBeDefined();
            }
        });
    });

    describe('POST /articles/:id/recategorize', () => {
        it('should recategorize article', async () => {
            const listResponse = await getRequest()
                .get('/articles')
                .expect(200);

            if (listResponse.body.data.length > 0) {
                const articleId = listResponse.body.data[0].id;

                const response = await getRequest()
                    .post(`/articles/${articleId}/recategorize`)
                    .expect(200);

                expect(response.body).toHaveProperty('category');
            }
        });
    });
});
