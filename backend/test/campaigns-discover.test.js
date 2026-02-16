const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.NODE_ENV = 'test';

const app = require('../src/server');
const Campaign = require('../src/models/Campaign');
const pool = require('../src/config/database');

const originalFindByCategoryWithFallback = Campaign.findByCategoryWithFallback;
const originalCountByCategory = Campaign.countByCategory;
const originalPoolQuery = pool.query;

function restoreStubs() {
  Campaign.findByCategoryWithFallback = originalFindByCategoryWithFallback;
  Campaign.countByCategory = originalCountByCategory;
  pool.query = originalPoolQuery;
}

function mockCampaign(id, category) {
  return {
    id: `${id}`,
    title: `Kampanya ${id}`,
    description: 'Test kampanyasi',
    source_name: 'Test Bank',
    source_id: 'source-1',
    icon_name: 'local_offer',
    icon_color: '#DC2626',
    icon_bg_color: '#FEE2E2',
    tags: ['test'],
    detail_text: 'Detay',
    original_url: 'https://example.com',
    affiliate_url: null,
    expires_at: '2030-01-01T00:00:00.000Z',
    how_to_use: [],
    validity_channels: [],
    status: 'active',
    category,
    sub_category: null,
    discount_percentage: 10,
    is_expired: false,
  };
}

function assertHasKeys(obj, keys) {
  for (const key of keys) {
    assert.equal(
      Object.prototype.hasOwnProperty.call(obj, key),
      true,
      `missing key "${key}"`,
    );
  }
}

test(
  'GET /api/campaigns/discover returns categories with clamped limit and hasMore metadata',
  { concurrency: false },
  async () => {
    const discoverCalls = [];
    const countCalls = [];

    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };

    Campaign.findByCategoryWithFallback = async (categoryId, limit, offset) => {
      discoverCalls.push({ categoryId, limit, offset });
      return {
        campaigns: [mockCampaign(`cmp-${categoryId}`, categoryId)],
        isEmpty: false,
      };
    };

    Campaign.countByCategory = async (categoryId, options = {}) => {
      countCalls.push({ categoryId, options });
      return 4;
    };

    try {
      const res = await request(app)
        .get('/api/campaigns/discover?limit=999')
        .set('x-device-id', 'discover-list-test');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.pagination.perCategoryLimit, 50);
      assert.equal(res.body.totalCategories, 6);
      assert.equal(Array.isArray(res.body.data), true);
      assert.equal(res.body.data.length, 6);
      assert.equal(res.body.data[0].totalCount, 4);
      assert.equal(res.body.data[0].hasMore, true);
      assert.equal(res.body.data[0].count, 1);

      assert.ok(discoverCalls.length > 0);
      assert.ok(countCalls.length > 0);
      assert.ok(discoverCalls.every((call) => call.limit === 50));
      assert.ok(discoverCalls.every((call) => call.offset === 0));
      assert.ok(
        countCalls.every((call) => call.options.includeExpired === false),
      );
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover response contract contains required keys',
  { concurrency: false },
  async () => {
    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };
    Campaign.findByCategoryWithFallback = async (categoryId) => {
      return {
        campaigns: [mockCampaign(`cmp-contract-${categoryId}`, categoryId)],
        isEmpty: false,
      };
    };
    Campaign.countByCategory = async () => 1;

    try {
      const res = await request(app)
        .get('/api/campaigns/discover?limit=3')
        .set('x-device-id', 'discover-contract-list-test');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assertHasKeys(res.body, ['success', 'data', 'totalCategories', 'pagination']);
      assertHasKeys(res.body.pagination, ['perCategoryLimit']);
      assert.equal(Array.isArray(res.body.data), true);
      assert.equal(res.body.data.length > 0, true);

      const category = res.body.data[0];
      assertHasKeys(category, [
        'id',
        'name',
        'icon',
        'sources',
        'minCampaigns',
        'campaigns',
        'count',
        'totalCount',
        'hasMore',
        'isEmpty',
        'fallbackMessage',
      ]);
      assert.equal(Array.isArray(category.campaigns), true);
      assert.equal(category.campaigns.length, 1);

      const campaign = category.campaigns[0];
      assertHasKeys(campaign, [
        'id',
        'title',
        'subtitle',
        'sourceName',
        'sourceId',
        'icon',
        'iconColor',
        'iconBgColor',
        'tags',
        'description',
        'detailText',
        'originalUrl',
        'affiliateUrl',
        'expiresAt',
        'howToUse',
        'validityChannels',
        'status',
        'category',
        'subCategory',
        'discountPercentage',
        'isExpired',
      ]);
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover/:category clamps limit/offset and returns pagination',
  { concurrency: false },
  async () => {
    let discoverCall = null;
    let countOptions = null;

    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };

    Campaign.findByCategoryWithFallback = async (categoryId, limit, offset) => {
      discoverCall = { categoryId, limit, offset };
      return {
        campaigns: [
          mockCampaign('cmp-food-1', categoryId),
          mockCampaign('cmp-food-2', categoryId),
        ],
        isEmpty: false,
      };
    };

    Campaign.countByCategory = async (_categoryId, options = {}) => {
      countOptions = options;
      return 10;
    };

    try {
      const res = await request(app)
        .get('/api/campaigns/discover/food?limit=500&offset=-7')
        .set('x-device-id', 'discover-category-pagination-test');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.category.id, 'food');
      assert.equal(res.body.data.pagination.limit, 100);
      assert.equal(res.body.data.pagination.offset, 0);
      assert.equal(res.body.data.count, 2);
      assert.equal(res.body.data.totalCount, 10);
      assert.equal(res.body.data.hasMore, true);

      assert.deepEqual(discoverCall, {
        categoryId: 'food',
        limit: 100,
        offset: 0,
      });
      assert.equal(countOptions.includeExpired, false);
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover/:category response contract contains required keys',
  { concurrency: false },
  async () => {
    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };
    Campaign.findByCategoryWithFallback = async (categoryId) => {
      return {
        campaigns: [mockCampaign(`cmp-contract-category-${categoryId}`, categoryId)],
        isEmpty: false,
      };
    };
    Campaign.countByCategory = async () => 1;

    try {
      const res = await request(app)
        .get('/api/campaigns/discover/food?limit=1&offset=0')
        .set('x-device-id', 'discover-contract-category-test');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assertHasKeys(res.body, ['success', 'data']);
      assertHasKeys(res.body.data, [
        'category',
        'campaigns',
        'count',
        'totalCount',
        'hasMore',
        'isEmpty',
        'fallbackMessage',
        'pagination',
      ]);
      assertHasKeys(res.body.data.category, [
        'id',
        'name',
        'icon',
        'sources',
        'minCampaigns',
        'fallbackMessage',
      ]);
      assertHasKeys(res.body.data.pagination, ['limit', 'offset']);
      assert.equal(Array.isArray(res.body.data.campaigns), true);
      assert.equal(res.body.data.campaigns.length, 1);
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover/:category returns 404 for unknown category',
  { concurrency: false },
  async () => {
    let discoverCalled = false;

    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };

    Campaign.findByCategoryWithFallback = async () => {
      discoverCalled = true;
      return { campaigns: [], isEmpty: true };
    };
    Campaign.countByCategory = async () => 0;

    try {
      const res = await request(app)
        .get('/api/campaigns/discover/not-a-real-category')
        .set('x-device-id', 'discover-unknown-category-test');

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, 'Kategori bulunamadı');
      assert.equal(discoverCalled, false);
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover/:category uses includeExpired=true when category fallback is empty',
  { concurrency: false },
  async () => {
    let countOptions = null;

    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };

    Campaign.findByCategoryWithFallback = async () => {
      return { campaigns: [], isEmpty: true };
    };
    Campaign.countByCategory = async (_categoryId, options = {}) => {
      countOptions = options;
      return 0;
    };

    try {
      const res = await request(app)
        .get('/api/campaigns/discover/food?limit=3&offset=0')
        .set('x-device-id', 'discover-empty-fallback-test');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.isEmpty, true);
      assert.equal(typeof res.body.data.fallbackMessage, 'string');
      assert.equal(res.body.data.count, 0);
      assert.equal(res.body.data.totalCount, 0);
      assert.equal(res.body.data.hasMore, false);
      assert.equal(countOptions.includeExpired, true);
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover uses default limit when query param is invalid',
  { concurrency: false },
  async () => {
    let capturedLimit = null;

    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };
    Campaign.findByCategoryWithFallback = async (_categoryId, limit) => {
      capturedLimit = limit;
      return {
        campaigns: [mockCampaign('cmp-default-limit', 'food')],
        isEmpty: false,
      };
    };
    Campaign.countByCategory = async () => 1;

    try {
      const res = await request(app)
        .get('/api/campaigns/discover?limit=abc')
        .set('x-device-id', 'discover-default-limit-test');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.pagination.perCategoryLimit, 20);
      assert.equal(capturedLimit, 20);
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover returns 500 when campaign fetch throws',
  { concurrency: false },
  async () => {
    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };
    Campaign.findByCategoryWithFallback = async () => {
      throw new Error('campaign fetch crash');
    };
    Campaign.countByCategory = async () => 0;

    try {
      const res = await request(app)
        .get('/api/campaigns/discover')
        .set('x-device-id', 'discover-list-500-test');

      assert.equal(res.status, 500);
      assert.equal(res.body.success, false);
      assert.equal(
        res.body.error,
        'Keşfet kampanyaları yüklenirken bir hata oluştu',
      );
      assert.equal(res.body.message, 'campaign fetch crash');
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover/:category returns 500 when campaign fetch throws',
  { concurrency: false },
  async () => {
    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };
    Campaign.findByCategoryWithFallback = async () => {
      throw new Error('category fetch crash');
    };
    Campaign.countByCategory = async () => 0;

    try {
      const res = await request(app)
        .get('/api/campaigns/discover/food')
        .set('x-device-id', 'discover-category-500-test');

      assert.equal(res.status, 500);
      assert.equal(res.body.success, false);
      assert.equal(
        res.body.error,
        'Kategori kampanyaları yüklenirken bir hata oluştu',
      );
      assert.equal(res.body.message, 'category fetch crash');
    } finally {
      restoreStubs();
    }
  },
);

test(
  'GET /api/campaigns/discover/:category computes hasMore=false on exact boundary',
  { concurrency: false },
  async () => {
    pool.query = async () => {
      throw new Error('DB unavailable in test');
    };
    Campaign.findByCategoryWithFallback = async (categoryId, limit, offset) => {
      assert.equal(limit, 2);
      assert.equal(offset, 0);
      return {
        campaigns: [
          mockCampaign('cmp-food-boundary-1', categoryId),
          mockCampaign('cmp-food-boundary-2', categoryId),
        ],
        isEmpty: false,
      };
    };
    Campaign.countByCategory = async () => 2;

    try {
      const res = await request(app)
        .get('/api/campaigns/discover/food?limit=2&offset=0')
        .set('x-device-id', 'discover-category-boundary-test');

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.count, 2);
      assert.equal(res.body.data.totalCount, 2);
      assert.equal(res.body.data.hasMore, false);
    } finally {
      restoreStubs();
    }
  },
);
