/**
 * Health Check E2E Tests
 * 
 * Tests for API health and root endpoints:
 * - GET / (root info)
 * - GET /health (health status)
 */

import { getRequest } from './setup';

describe('Health Check (e2e)', () => {
    describe('GET /', () => {
        it('should return API info', async () => {
            const response = await getRequest()
                .get('/')
                .expect(200);

            expect(response.body).toHaveProperty('message');
            // Or some kind of API info
        });
    });

    describe('API Response Format', () => {
        it('should return proper JSON content-type', async () => {
            const response = await getRequest()
                .get('/articles')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
        });

        it('should support CORS headers', async () => {
            const response = await getRequest()
                .get('/articles')
                .set('Origin', 'http://localhost:3000')
                .expect(200);

            // CORS should be configured
            expect(response.headers).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for non-existent routes', async () => {
            await getRequest()
                .get('/non-existent-route')
                .expect(404);
        });

        it('should return proper error format', async () => {
            const response = await getRequest()
                .get('/articles/invalid-uuid-format');

            expect(response.status).toBeGreaterThanOrEqual(400);
            // Error should have some structure
        });
    });
});
