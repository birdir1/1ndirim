const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const { cacheMiddleware } = require('../src/middleware/cache');
const CacheService = require('../src/services/cacheService');

const originalIsAvailable = CacheService.isAvailable;
const originalGet = CacheService.get;
const originalSet = CacheService.set;

function restoreCacheStubs() {
  CacheService.isAvailable = originalIsAvailable;
  CacheService.get = originalGet;
  CacheService.set = originalSet;
}

test('cacheMiddleware caches successful responses and serves cached payload', async () => {
  const memory = new Map();

  CacheService.isAvailable = () => true;
  CacheService.get = async (key) => memory.get(key) || null;
  CacheService.set = async (key, value) => {
    memory.set(key, value);
    return true;
  };

  const app = express();
  app.get(
    '/ok',
    cacheMiddleware(60),
    (req, res) => res.json({ success: true, value: Date.now() }),
  );

  try {
    const first = await request(app).get('/ok');
    const second = await request(app).get('/ok');

    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    assert.equal(first.body.success, true);
    assert.deepEqual(second.body, first.body, 'cached response should match first body');
    assert.equal(memory.size > 0, true);
  } finally {
    restoreCacheStubs();
  }
});

test('cacheMiddleware does not cache error responses', async () => {
  const memory = new Map();

  CacheService.isAvailable = () => true;
  CacheService.get = async (key) => memory.get(key) || null;
  CacheService.set = async (key, value) => {
    memory.set(key, value);
    return true;
  };

  const app = express();
  app.get(
    '/fail',
    cacheMiddleware(60),
    (req, res) => res.status(500).json({ success: false, error: 'fail' }),
  );

  try {
    const first = await request(app).get('/fail');
    const second = await request(app).get('/fail');

    assert.equal(first.status, 500);
    assert.equal(second.status, 500);
    assert.equal(memory.size, 0, 'error responses should not be cached');
  } finally {
    restoreCacheStubs();
  }
});
