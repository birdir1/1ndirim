/**
 * Epic Games Campaign Scraper
 * Epic Games free games kampanyalarını toplar (Keşfet - Gaming kategorisi için)
 * 
 * CREATED: Phase 3.9
 * - Scrapes Epic Games free games page
 * - Category: gaming
 * - Sub-category: Epic Games
 */

const BaseFetchScraper = require('./fetch/base-fetch-scraper');

const EPIC_API_URL =
  'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=tr&country=TR&allowCountries=TR';

function toDateOnly(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function pickImage(keyImages) {
  if (!Array.isArray(keyImages) || keyImages.length === 0) return null;
  const preferred = [
    'OfferImageWide',
    'featuredMedia',
    'DieselStoreFrontWide',
    'Thumbnail',
    'OfferImageTall',
    'DieselStoreFrontTall',
  ];
  for (const type of preferred) {
    const match = keyImages.find((k) => k && k.type === type && k.url);
    if (match && match.url) return match.url;
  }
  const first = keyImages.find((k) => k && k.url);
  return first ? first.url : null;
}

class EpicGamesScraper extends BaseFetchScraper {
  constructor() {
    super('Epic Games', 'https://store.epicgames.com/tr/free-games');
    this.apiEndpoint = EPIC_API_URL;
  }

  getApiEndpoint() {
    return this.apiEndpoint;
  }

  /**
   * Epic Games kampanyalarını parse eder
   */
  parseApiResponse(data) {
    const campaigns = [];
    const elements = data?.data?.Catalog?.searchStore?.elements || [];

    for (const el of elements) {
      const promos = (el.promotions?.promotionalOffers || [])
        .flatMap((p) => p.promotionalOffers || []);
      if (!promos.length) continue;

      const promo = promos[0];
      const discountPercent = promo.discountSetting?.discountPercentage ?? 0;
      if (discountPercent < 100) continue;

      const startAt = toDateOnly(promo.startDate);
      const endAt = toDateOnly(promo.endDate);
      if (!endAt) continue;

      const slugRaw =
        el.productSlug ||
        el.urlSlug ||
        el.catalogNs?.mappings?.[0]?.pageSlug ||
        el.offerMappings?.[0]?.pageSlug ||
        '';
      const slug = String(slugRaw || '').replace(/^\/+|\/+$/g, '');
      const url = slug ? `https://store.epicgames.com/p/${slug}` : this.sourceUrl;

      const imageUrl = pickImage(el.keyImages);
      const title = (el.title || '').toString().trim() || 'Epic Ücretsiz Oyun';
      const description =
        (el.description || '').toString().trim() ||
        `Epic Games Store'da ${title} ücretsiz. Kütüphanenize ekleyin ve kalıcı olarak sahip olun.`;

      const campaign = {
        sourceName: this.sourceName,
        title,
        description,
        detailText: description,
        campaignUrl: url,
        originalUrl: url,
        affiliateUrl: null,
        startDate: startAt || new Date().toISOString().split('T')[0],
        endDate: endAt,
        category: 'gaming',
        subCategory: 'free',
        platform: 'epic',
        contentType: 'game',
        isFree: true,
        discountPercent: discountPercent || 100,
        videoThumbnailUrl: imageUrl,
        howToUse: [
          'Epic Games hesabınızla giriş yapın',
          'Ücretsiz oyunu kütüphanenize ekleyin',
          'İndirip oynayın',
        ],
        tags: ['Epic Games', 'Ücretsiz Oyun', 'PC Gaming', 'Free Game'],
        channel: 'online',
      };

      campaigns.push(campaign);
    }

    if (campaigns.length === 0) {
      console.log(`⚠️  ${this.sourceName}: Canlı kampanya bulunamadı`);
    }

    console.log(`✅ ${this.sourceName}: ${campaigns.length} kampanya bulundu`);
    return campaigns;
  }

  createAnchorCampaigns() {
    return [];
  }
}

module.exports = EpicGamesScraper;
