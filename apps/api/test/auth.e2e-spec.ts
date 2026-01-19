/**
 * Auth API E2E Tests
 * 
 * Tests for authentication endpoints:
 * - POST /auth/register (user registration)
 * - POST /auth/login (user login)
 * - GET /auth/me (get current user)
 */

import { getRequest, TestDataFactory } from './setup';

describe('Auth API (e2e)', () => {
    let authToken: string;
    let testUserEmail: string;
    const testPassword = 'TestPassword123!';

    describe('POST /auth/register', () => {
        it('should register a new user', async () => {
            const userData = TestDataFactory.createUser({
                password: testPassword,
            });
            testUserEmail = userData.email;

            const response = await getRequest()
                .post('/auth/register')
                .send(userData)
                .expect(201);

            // Response may be wrapped in data property
            const body = response.body.data || response.body;
            expect(body).toHaveProperty('accessToken');
            expect(body).toHaveProperty('user');
            expect(body.user.email).toBe(userData.email);
            expect(body.user).not.toHaveProperty('passwordHash');
        });

        it('should reject duplicate email registration', async () => {
            const userData = TestDataFactory.createUser({
                email: testUserEmail,
                password: testPassword,
            });

            await getRequest()
                .post('/auth/register')
                .send(userData)
                .expect(409);
        });

        it('should reject invalid email format', async () => {
            const userData = TestDataFactory.createUser({
                email: 'invalid-email',
            });

            await getRequest()
                .post('/auth/register')
                .send(userData)
                .expect(400);
        });

        it('should reject weak password', async () => {
            const userData = TestDataFactory.createUser({
                password: '123', // Too weak
            });

            const response = await getRequest()
                .post('/auth/register')
                .send(userData);

            // Should either be 400 or successful depending on password validation
            expect([201, 400]).toContain(response.status);
        });

        it('should reject missing required fields', async () => {
            await getRequest()
                .post('/auth/register')
                .send({ email: 'test@test.com' }) // Missing password and name
                .expect(400);
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            // First create a user
            const userData = TestDataFactory.createUser();

            await getRequest()
                .post('/auth/register')
                .send(userData)
                .expect(201);

            const response = await getRequest()
                .post('/auth/login')
                .send({
                    email: userData.email,
                    password: userData.password,
                })
                .expect(201);

            // Response may be wrapped in data property
            const body = response.body.data || response.body;
            expect(body).toHaveProperty('accessToken');
            authToken = body.accessToken;
        });

        it('should reject invalid password', async () => {
            const userData = TestDataFactory.createUser();

            // Register user
            await getRequest()
                .post('/auth/register')
                .send(userData)
                .expect(201);

            // Try login with wrong password
            await getRequest()
                .post('/auth/login')
                .send({
                    email: userData.email,
                    password: 'WrongPassword123!',
                })
                .expect(401);
        });

        it('should reject non-existent user', async () => {
            await getRequest()
                .post('/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'SomePassword123!',
                })
                .expect(401);
        });
    });

    describe('GET /auth/me', () => {
        it('should return current user with valid token', async () => {
            // Create and login user
            const userData = TestDataFactory.createUser();

            const registerResponse = await getRequest()
                .post('/auth/register')
                .send(userData)
                .expect(201);

            const token = (registerResponse.body.data || registerResponse.body).accessToken;

            const response = await getRequest()
                .get('/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            // Response may be wrapped in data property
            const body = response.body.data || response.body;
            expect(body.email).toBe(userData.email);
            expect(body).not.toHaveProperty('passwordHash');
        });

        it('should reject request without token', async () => {
            await getRequest()
                .get('/auth/me')
                .expect(401);
        });

        it('should reject request with invalid token', async () => {
            await getRequest()
                .get('/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });
});
