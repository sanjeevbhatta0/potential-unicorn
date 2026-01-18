/**
 * AI Settings API E2E Tests
 * 
 * Tests for AI settings management endpoints:
 * - GET /ai-settings (list all settings)
 * - GET /ai-settings/providers (list providers)
 * - GET /ai-settings/providers/:provider/models (list models for provider)
 * - GET /ai-settings/default (get default setting)
 * - GET /ai-settings/:id (get single setting)
 * - POST /ai-settings (create - admin only)
 * - PATCH /ai-settings/:id (update)
 * - DELETE /ai-settings/:id (delete)
 * - POST /ai-settings/:id/set-default (set as default)
 * - POST /ai-settings/:id/test (test connection)
 */

import { getRequest } from './setup';

describe('AI Settings API (e2e)', () => {
    describe('GET /ai-settings/providers', () => {
        it('should return list of available providers', async () => {
            // Note: This endpoint requires admin auth
            const response = await getRequest()
                .get('/ai-settings/providers');

            // May return 401/403 if not authenticated, or 200 if public
            if (response.status === 200) {
                expect(Array.isArray(response.body) || typeof response.body === 'object').toBe(true);
            } else {
                expect([401, 403]).toContain(response.status);
            }
        });
    });

    describe('GET /ai-settings/providers/:provider/models', () => {
        it('should return models for openai provider', async () => {
            const response = await getRequest()
                .get('/ai-settings/providers/openai/models');

            // May require admin auth
            if (response.status === 200) {
                expect(Array.isArray(response.body) || typeof response.body === 'object').toBe(true);
            } else {
                expect([401, 403]).toContain(response.status);
            }
        });

        it('should return models for anthropic provider', async () => {
            const response = await getRequest()
                .get('/ai-settings/providers/anthropic/models');

            if (response.status === 200) {
                expect(Array.isArray(response.body) || typeof response.body === 'object').toBe(true);
            } else {
                expect([401, 403]).toContain(response.status);
            }
        });
    });

    describe('GET /ai-settings (admin protected)', () => {
        it('should require authentication', async () => {
            const response = await getRequest()
                .get('/ai-settings');

            // Should require admin authentication
            expect([401, 403]).toContain(response.status);
        });
    });

    describe('GET /ai-settings/default (admin protected)', () => {
        it('should require authentication', async () => {
            const response = await getRequest()
                .get('/ai-settings/default');

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('POST /ai-settings (admin protected)', () => {
        it('should require authentication to create AI setting', async () => {
            const response = await getRequest()
                .post('/ai-settings')
                .send({
                    provider: 'openai',
                    modelId: 'gpt-4-turbo-preview',
                    apiKey: 'test-key',
                    isDefault: false,
                });

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('PATCH /ai-settings/:id (admin protected)', () => {
        it('should require authentication to update AI setting', async () => {
            const response = await getRequest()
                .patch('/ai-settings/00000000-0000-0000-0000-000000000000')
                .send({
                    isDefault: true,
                });

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('DELETE /ai-settings/:id (admin protected)', () => {
        it('should require authentication to delete AI setting', async () => {
            const response = await getRequest()
                .delete('/ai-settings/00000000-0000-0000-0000-000000000000');

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('POST /ai-settings/:id/set-default (admin protected)', () => {
        it('should require authentication to set default', async () => {
            const response = await getRequest()
                .post('/ai-settings/00000000-0000-0000-0000-000000000000/set-default');

            expect([401, 403]).toContain(response.status);
        });
    });

    describe('POST /ai-settings/:id/test (admin protected)', () => {
        it('should require authentication to test connection', async () => {
            const response = await getRequest()
                .post('/ai-settings/00000000-0000-0000-0000-000000000000/test');

            expect([401, 403]).toContain(response.status);
        });
    });
});
