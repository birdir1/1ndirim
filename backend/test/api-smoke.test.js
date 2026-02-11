const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.RATE_LIMIT_MAX = '6';

const app = require('../src/server');

test('GET / returns API metadata', async () => {
  const res = await request(app).get('/');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(typeof res.body.endpoints, 'object');
  assert.equal(typeof res.body.endpoints.campaigns, 'string');
});

test('GET unknown endpoint returns 404 JSON', async () => {
  const res = await request(app).get('/__not_found__');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Endpoint bulunamadı');
});

test('rate limiter returns JSON for excessive requests', async () => {
  const agent = request(app);
  for (let i = 0; i < 10; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await agent.get('/');
  }
  const res = await agent.get('/');
  assert.equal(res.status, 429);
  assert.equal(res.body.success, false);
  assert.match(res.body.error, /Çok fazla istek/i);
});
