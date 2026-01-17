const crypto = require('crypto');

const secret = 'dev-secret-key-change-in-production';

const header = {
    alg: 'HS256',
    typ: 'JWT'
};

const now = Math.floor(Date.now() / 1000);
const payload = {
    role: 'admin',
    email: 'crawler@internal',
    sub: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Matches DB ID
    iat: now,
    exp: now + (365 * 24 * 60 * 60) // 1 year
};

function base64url(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

const encodedHeader = base64url(JSON.stringify(header));
const encodedPayload = base64url(JSON.stringify(payload));

const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedHeader + '.' + encodedPayload)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

const token = `${encodedHeader}.${encodedPayload}.${signature}`;
console.log(token);
