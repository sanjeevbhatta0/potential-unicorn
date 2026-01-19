/**
 * Test Setup and Utilities for API E2E Tests
 * 
 * This file provides common utilities and setup for all E2E tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

// Global test app instance
let app: INestApplication;
let moduleFixture: TestingModule;

// Test configuration
export const TEST_API_KEY = 'crawler-secret-key-2026';
export const TEST_ADMIN_TOKEN = 'test-admin-token';

/**
 * Initialize the test application
 */
export async function initTestApp(): Promise<INestApplication> {
    if (app) {
        return app;
    }

    moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Use the same validation pipe as the main app
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    await app.init();
    return app;
}

/**
 * Close the test application
 */
export async function closeTestApp(): Promise<void> {
    if (app) {
        await app.close();
        app = null as any;
    }
}

/**
 * Get the test application instance
 */
export function getTestApp(): INestApplication {
    if (!app) {
        throw new Error('Test app not initialized. Call initTestApp() first.');
    }
    return app;
}

/**
 * Get supertest request agent
 */
export function getRequest() {
    return request(getTestApp().getHttpServer());
}

/**
 * Test data factory
 */
export const TestDataFactory = {
    createArticle: (overrides: Partial<any> = {}) => ({
        title: 'Test Article Title',
        content: 'This is test article content for testing purposes. It contains enough text to be processed.',
        summary: 'Test summary',
        sourceUrl: `https://test.com/article-${Date.now()}`,
        sourceName: 'Test Source',
        category: 'politics',
        language: 'en',
        publishedAt: new Date().toISOString(),
        ...overrides,
    }),

    createSource: (overrides: Partial<any> = {}) => ({
        name: `Test Source ${Date.now()}`,
        url: `https://testsource-${Date.now()}.com`,
        type: 'website',
        language: 'en',
        isActive: true,
        crawlConfig: {
            articleLinkSelector: 'a.article-link',
            titleSelector: 'h1.title',
            contentSelector: 'div.content',
            dateSelector: 'time.published',
        },
        ...overrides,
    }),

    createUser: (overrides: Partial<any> = {}) => ({
        email: `testuser-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        fullName: 'Test User',
        ...overrides,
    }),
};

/**
 * Wait helper
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Clean test data helper - for use in afterAll hooks
 */
export async function cleanTestData() {
    // This would clean up test data from the database
    // For now, we rely on test isolation
    console.log('Cleaning test data...');
}

// Global setup
beforeAll(async () => {
    await initTestApp();
});

// Global teardown
afterAll(async () => {
    await closeTestApp();
});
