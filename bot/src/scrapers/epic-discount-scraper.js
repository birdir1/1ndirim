/**
 * Epic Games Discounted Games Scraper
 * Epic Games Store'daki indirimli oyunları toplar (Keşfet - Gaming)
 *
 * Kaynak sayfa: Epic browse (priceTier=tierDiscouted)
 * - Network JSON'dan searchStore.elements parse edilir
 * - %100 indirim (free) burada çıkarılmaz (Epic free scraper handle eder)
 */

const BaseScraper = require('./base-scraper');

const EPIC_DISCOUNT_BROWSE_URL =
  'https://store.epicgames.com/tr/browse?sortBy=releaseDate&sortDir=DESC&priceTier=tierDiscouted&category=Game&count=40&start=0';

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

function extractElements(payload) {
  if (!payload || typeof payload !== 'object') return [];
  const direct = payload?.data?.Catalog?.searchStore?.elements;
  if (Array.isArray(direct)) return direct;
  const alt = payload?.Catalog?.searchStore?.elements;
  if (Array.isArray(alt)) return alt;
  return [];
}

class EpicDiscountScraper extends BaseScraper {
  constructor() {
    super('Epic Games', EPIC_DISCOUNT_BROWSE_URL);
  }

  getCampaignsFromNetwork(responses) {
    const elements = [];
    for (const res of responses || []) {
      const list = extractElements(res.data);
      if (list.length) elements.push(...list);
    }

    const campaigns = [];
    for (const el of elements) {
      try {
        const price = el.price?.totalPrice || {};
        const discountPercent = Number(price.discountPercentage ?? price.discount ?? 0);
        if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent >= 100) continue;

        const title = (el.title || '').toString().trim();
        if (!title) continue;

        const promos = (el.promotions?.promotionalOffers || [])
          .flatMap((p) => p.promotionalOffers || []);
        const promo = promos[0] || null;
        const startAt = toDateOnly(promo?.startDate) || new Date().toISOString().split('T')[0];
        const endAt = toDateOnly(promo?.endDate) || this.getEndDate(14);

        const slugRaw =
          el.productSlug ||
          el.urlSlug ||
          el.catalogNs?.mappings?.[0]?.pageSlug ||
          el.offerMappings?.[0]?.pageSlug ||
          '';
        const slug = String(slugRaw || '').replace(/^\/+|\/+$/g, '');
        const url = slug ? `https://store.epicgames.com/p/${slug}` : this.sourceUrl;

        const imageUrl = pickImage(el.keyImages);

        campaigns.push({
          sourceName: this.sourceName,
          title,
          description: `Epic Games Store'da ${title} oyununda %${discountPercent} indirim.`,
          detailText: `Epic Games Store'da ${title} oyunu %${discountPercent} indirimli. Bitiş tarihi: ${endAt}.`,
          campaignUrl: url,
          originalUrl: url,
          affiliateUrl: null,
          startDate: startAt,
          endDate: endAt,
          category: 'gaming',
          subCategory: 'sale',
          platform: 'epic',
          contentType: 'game',
          isFree: false,
          discountPercent: discountPercent,
          videoThumbnailUrl: imageUrl,
          howToUse: [
            'Epic Games hesabınızla giriş yapın',
            'Oyunu sepete ekleyin',
            'İndirimi kullanarak satın alın',
          ],
          tags: ['Epic Games', 'İndirimli Oyun', 'PC'],
          channel: 'online',
        });
      } catch (error) {
        console.error(`❌ ${this.sourceName}: Epic discount parse hatası:`, error.message);
      }
    }

    if (campaigns.length === 0) {
      console.log(`⚠️  ${this.sourceName}: İndirimli oyun bulunamadı`);
    }

    console.log(`✅ ${this.sourceName}: ${campaigns.length} indirimli oyun bulundu`);
    return campaigns;
  }

  async scrape() {
    // Network JSON bekleniyor. DOM fallback yok.
    return [];
  }

  getEndDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }
}

module.exports = EpicDiscountScraper;
