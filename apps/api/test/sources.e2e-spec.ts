/**
 * Sources API E2E Tests
 * 
 * Tests for all sources-related endpoints:
 * - GET /sources (list all sources)
 * - GET /sources/active (get active sources)
 * - GET /sources/:id (single source)
 * - GET /sources/type/:type (by type)
 * - GET /sources/language/:language (by language)
 * - POST /sources (create - admin only)
 * - PATCH /sources/:id (update)
 * - DELETE /sources/:id (delete)
 */

import { getRequest, TestDataFactory } from './setup';

describe('Sources API (e2e)', () => {
    let createdSourceId: string;

    describe('GET /sources', () => {
        it('should return list of sources', async () => {
            const response = await getRequest()
                .get('/sources')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter by isActive', async () => {
            const response = await getRequest()
                .get('/sources')
                .query({ isActive: true })
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                response.body.forEach((source: any) => {
                    expect(source.isActive).toBe(true);
                });
            }
        });
    });

    describe('GET /sources/active', () => {
        it('should return only active sources', async () => {
            const response = await getRequest()
                .get('/sources/active')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            response.body.forEach((source: any) => {
                expect(source.isActive).toBe(true);
            });
        });
    });

    describe('GET /sources/type/:type', () => {
        it('should return sources by type - website', async () => {
            const response = await getRequest()
                .get('/sources/type/website')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                response.body.forEach((source: any) => {
                    expect(source.type).toBe('website');
                });
            }
        });

        it('should return sources by type - youtube', async () => {
            const response = await getRequest()
                .get('/sources/type/youtube')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /sources/language/:language', () => {
        it('should return sources by language - ne (Nepali)', async () => {
            const response = await getRequest()
                .get('/sources/language/ne')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            if (response.body.length > 0) {
                response.body.forEach((source: any) => {
                    expect(source.language).toBe('ne');
                });
            }
        });

        it('should return sources by language - en (English)', async () => {
            const response = await getRequest()
                .get('/sources/language/en')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /sources/:id', () => {
        it('should return source by ID', async () => {
            // First get a source ID from the list
            const listResponse = await getRequest()
                .get('/sources')
                .expect(200);

            if (listResponse.body.length > 0) {
                const sourceId = listResponse.body[0].id;

                const response = await getRequest()
                    .get(`/sources/${sourceId}`)
                    .expect(200);

                expect(response.body.id).toBe(sourceId);
                expect(response.body).toHaveProperty('name');
                expect(response.body).toHaveProperty('url');
                expect(response.body).toHaveProperty('type');
            }
        });

        it('should return 404 for non-existent source', async () => {
            await getRequest()
                .get('/sources/00000000-0000-0000-0000-000000000000')
                .expect(404);
        });
    });

    describe('Source CRUD operations (requires admin)', () => {
        // Note: These tests may need admin authentication
        // For now, we test that they properly require authentication

        it('should require authentication for POST /sources', async () => {
            const sourceData = TestDataFactory.createSource();

            const response = await getRequest()
                .post('/sources')
                .send(sourceData);

            // Should be 401 or 403 depending on auth setup
            expect([401, 403]).toContain(response.status);
        });

        it('should require authentication for PATCH /sources/:id', async () => {
            const listResponse = await getRequest()
                .get('/sources')
                .expect(200);

            if (listResponse.body.length > 0) {
                const response = await getRequest()
                    .patch(`/sources/${listResponse.body[0].id}`)
                    .send({ name: 'Updated Name' });

                expect([401, 403]).toContain(response.status);
            }
        });

        it('should require authentication for DELETE /sources/:id', async () => {
            const listResponse = await getRequest()
                .get('/sources')
                .expect(200);

            if (listResponse.body.length > 0) {
                const response = await getRequest()
                    .delete(`/sources/${listResponse.body[0].id}`);

                expect([401, 403]).toContain(response.status);
            }
        });
    });
});
