module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    testTimeout: 60000,
    verbose: true,
    setupFilesAfterEnv: [],
    collectCoverageFrom: [
        '**/*.ts',
        '!**/node_modules/**',
    ],
    coverageDirectory: './coverage',
    coverageReporters: ['text', 'lcov'],
};
