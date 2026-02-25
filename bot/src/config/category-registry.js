/**
 * Category Registry
 * Central configuration for all categories and their sources
 * 
 * ARCHITECTURE: Category-driven, not brand-by-brand
 * Each category has dedicated scrapers or scraper groups
 */

const CATEGORY_REGISTRY = {
  entertainment: {
    id: 'entertainment',
    name: 'Eğlence',
    icon: '🎬',
    minCampaigns: 15,
    priority: 'high',
    sources: [
      {
        name: 'Netflix',
        url: 'https://www.netflix.com/tr/',
        type: 'anchor', // Manual entry system
        scraperClass: 'NetflixScraper',
        enabled: true,
      },
      {
        name: 'Amazon Prime Video',
        url: 'https://www.primevideo.com/region/eu/offers',
        type: 'anchor',
        scraperClass: 'PrimeVideoScraper',
        enabled: true,
      },
      {
        name: 'Exxen',
        url: 'https://www.exxen.com/',
        type: 'spa',
        scraperClass: 'ExxenScraper',
        enabled: true,
      },
      {
        name: 'Gain',
        url: 'https://www.gain.tv/',
        type: 'spa',
        scraperClass: 'GainScraper',
        enabled: true,
      },
      {
        name: 'BluTV',
        url: 'https://www.blutv.com/',
        type: 'spa',
        scraperClass: 'BluTVScraper',
        enabled: true,
      },
      {
        name: 'Tivibu Go',
        url: 'https://www.tivibugo.com.tr/',
        type: 'spa',
        scraperClass: 'TivibuGoScraper',
        enabled: true,
      },
      {
        name: 'Disney+',
        url: 'https://www.disneyplus.com/tr-tr',
        type: 'anchor',
        scraperClass: 'DisneyPlusScraper',
        enabled: true,
      },
      {
        name: 'YouTube Premium',
        url: 'https://www.youtube.com/premium',
        type: 'anchor',
        scraperClass: 'YouTubePremiumScraper',
        enabled: true,
      },
    ],
  },

  gaming: {
    id: 'gaming',
    name: 'Oyun',
    icon: '🎮',
    minCampaigns: 10,
    priority: 'high',
    sources: [
      {
        name: 'Steam',
        url: 'https://store.steampowered.com/specials',
        type: 'html',
        scraperClass: 'SteamScraper',
        enabled: true,
      },
      {
        name: 'Epic Games',
        url: 'https://store.epicgames.com/tr/free-games',
        type: 'spa',
        scraperClass: 'EpicGamesScraper',
        enabled: true,
      },
      {
        name: 'NVIDIA',
        url: 'https://www.nvidia.com/tr-tr/geforce/campaigns/',
        type: 'html',
        scraperClass: 'NvidiaScraper',
        enabled: true,
      },
      {
        name: 'PlayStation Store',
        url: 'https://store.playstation.com/tr-tr/pages/latest',
        type: 'spa',
        scraperClass: 'PlayStationScraper',
        enabled: true,
      },
      {
        name: 'Xbox Game Pass',
        url: 'https://www.xbox.com/tr-TR/xbox-game-pass',
        type: 'anchor',
        scraperClass: 'XboxGamePassScraper',
        enabled: true,
      },
    ],
  },

  fashion: {
    id: 'fashion',
    name: 'Giyim',
    icon: '👕',
    minCampaigns: 20,
    priority: 'medium',
    sources: [
      // Top 10 giyim markası
      { name: 'Zara', url: 'https://www.zara.com/tr/', type: 'spa', scraperClass: 'ZaraFetchScraper', enabled: true },
      { name: 'H&M', url: 'https://www2.hm.com/tr_tr/index.html', type: 'spa', scraperClass: 'HMFetchScraper', enabled: true },
      { name: 'Bershka', url: 'https://www.bershka.com/tr/', type: 'spa', scraperClass: 'BershkaFetchScraper', enabled: true },
      { name: 'Pull&Bear', url: 'https://www.pullandbear.com/tr/', type: 'spa', scraperClass: 'PullBearFetchScraper', enabled: true },
      { name: 'LCW', url: 'https://www.lcwaikiki.com/tr-TR/TR', type: 'spa', scraperClass: 'LCWFetchScraper', enabled: true },
      { name: 'Koton', url: 'https://www.koton.com/tr/', type: 'spa', scraperClass: 'KotonFetchScraper', enabled: true },
      { name: 'Mavi', url: 'https://www.mavi.com/', type: 'spa', scraperClass: 'MaviFetchScraper', enabled: true },
      { name: 'DeFacto', url: 'https://www.defacto.com.tr/', type: 'spa', scraperClass: 'DeFactoFetchScraper', enabled: true },
      { name: "Collins", url: 'https://www.collins.com.tr/', type: 'spa', scraperClass: 'CollinsFetchScraper', enabled: true },
      { name: 'Beymen', url: 'https://www.beymen.com/tr', type: 'spa', scraperClass: 'BeymenFetchScraper', enabled: true },
    ],
  },

  cosmetics: {
    id: 'cosmetics',
    name: 'Kozmetik',
    icon: '💄',
    minCampaigns: 10,
    priority: 'medium',
    sources: [
      // Top 5 makyaj markası
      { name: 'Sephora', url: 'https://www.sephora.com.tr/', type: 'spa', scraperClass: 'SephoraFetchScraper', enabled: true },
      { name: 'Gratis', url: 'https://www.gratis.com/', type: 'spa', scraperClass: 'GratisFetchScraper', enabled: true },
      { name: 'Watsons', url: 'https://www.watsons.com.tr/', type: 'spa', scraperClass: 'WatsonsFetchScraper', enabled: true },
      { name: 'MAC Cosmetics', url: 'https://www.maccosmetics.com.tr/', type: 'spa', scraperClass: 'MacCosmeticsFetchScraper', enabled: true },
      { name: 'Flormar', url: 'https://www.flormar.com.tr/', type: 'spa', scraperClass: 'FlormarFetchScraper', enabled: true },
    ],
  },

  supplement: {
    id: 'supplement',
    name: 'Supplement',
    icon: '💊',
    minCampaigns: 10,
    priority: 'low',
    sources: [
      { name: 'Supplementler.com', url: 'https://www.supplementler.com/', type: 'spa', scraperClass: 'SupplementlerScraper', enabled: true },
      { name: 'BigJoy', url: 'https://www.bigjoy.com.tr/', type: 'spa', scraperClass: 'BigJoyScraper', enabled: true },
      { name: 'Hardline Nutrition', url: 'https://www.hardlinenutrition.com/', type: 'spa', scraperClass: 'HardlineScraper', enabled: true },
      { name: 'Muscle & Fitness Türkiye', url: 'https://www.musclefitness.com.tr/', type: 'spa', scraperClass: 'MuscleFitnessScraper', enabled: true },
      { name: 'Protein7', url: 'https://www.protein7.com/', type: 'spa', scraperClass: 'Protein7Scraper', enabled: true },
    ],
  },

  food: {
    id: 'food',
    name: 'Yemek',
    icon: '🍔',
    minCampaigns: 10,
    priority: 'high',
    sources: [
      { name: 'Yemeksepeti', url: 'https://www.yemeksepeti.com/kampanyalar', type: 'spa', scraperClass: 'YemeksepetiScraper', enabled: true },
      { name: 'Getir Yemek', url: 'https://www.getir.com/yemek/', type: 'spa', scraperClass: 'GetirYemekScraper', enabled: true },
      { name: 'Trendyol Yemek', url: 'https://www.trendyolyemek.com/', type: 'spa', scraperClass: 'TrendyolYemekScraper', enabled: true },
      { name: 'Migros Yemek', url: 'https://www.migros.com.tr/', type: 'spa', scraperClass: 'MigrosYemekScraper', enabled: true },
    ],
  },

  'travel-air': {
    id: 'travel-air',
    name: 'Uçak Bileti',
    icon: '✈️',
    minCampaigns: 10,
    priority: 'medium',
    sources: [
      { name: 'Türk Hava Yolları', url: 'https://www.turkishairlines.com/tr-tr/kampanyalar/', type: 'html', scraperClass: 'THYScraper', enabled: true },
      { name: 'Pegasus', url: 'https://www.flypgs.com/kampanyalar', type: 'spa', scraperClass: 'PegasusScraper', enabled: true },
      { name: 'AJet', url: 'https://www.ajet.com.tr/', type: 'spa', scraperClass: 'AJetScraper', enabled: true },
    ],
  },

  transport: {
    id: 'transport',
    name: 'Ulaşım',
    icon: '🚕',
    minCampaigns: 5,
    priority: 'low',
    sources: [
      { name: 'Uber', url: 'https://www.uber.com/tr/tr/ride/', type: 'anchor', scraperClass: 'UberScraper', enabled: true },
      { name: 'BiTaksi', url: 'https://www.bitaksi.com/', type: 'spa', scraperClass: 'BiTaksiScraper', enabled: true },
      { name: 'Yandex Go', url: 'https://go.yandex/tr_tr/', type: 'spa', scraperClass: 'YandexGoScraper', enabled: true },
    ],
  },

  'travel-bus': {
    id: 'travel-bus',
    name: 'Otobüs Bileti',
    icon: '🚌',
    minCampaigns: 10,
    priority: 'medium',
    // IMPORTANT: Only aggregators, not individual bus companies
    sources: [
      { name: 'Obilet', url: 'https://www.obilet.com/kampanyalar', type: 'spa', scraperClass: 'ObiletScraper', enabled: true },
      { name: 'UcuzaBilet', url: 'https://www.ucuzabilet.com/', type: 'spa', scraperClass: 'UcuzaBiletScraper', enabled: true },
      { name: 'Biletall', url: 'https://www.biletall.com/', type: 'spa', scraperClass: 'BiletallScraper', enabled: true },
      { name: 'NeredenNereye', url: 'https://www.neredennereye.com/', type: 'spa', scraperClass: 'NeredenNereyeScraper', enabled: true },
    ],
  },
};

/**
 * Get all categories
 */
function getAllCategories() {
  return Object.values(CATEGORY_REGISTRY);
}

/**
 * Get category by ID
 */
function getCategoryById(categoryId) {
  return CATEGORY_REGISTRY[categoryId];
}

/**
 * Get all sources for a category
 */
function getSourcesByCategory(categoryId) {
  const category = CATEGORY_REGISTRY[categoryId];
  return category ? category.sources : [];
}

/**
 * Get all enabled sources across all categories
 */
function getAllEnabledSources() {
  const sources = [];
  for (const category of Object.values(CATEGORY_REGISTRY)) {
    for (const source of category.sources) {
      if (source.enabled) {
        sources.push({
          ...source,
          categoryId: category.id,
          categoryName: category.name,
        });
      }
    }
  }
  return sources;
}

/**
 * Get category coverage stats
 */
function getCategoryCoverage() {
  const coverage = {};
  for (const [categoryId, category] of Object.entries(CATEGORY_REGISTRY)) {
    coverage[categoryId] = {
      name: category.name,
      icon: category.icon,
      totalSources: category.sources.length,
      enabledSources: category.sources.filter(s => s.enabled).length,
      minCampaigns: category.minCampaigns,
      priority: category.priority,
    };
  }
  return coverage;
}

module.exports = {
  CATEGORY_REGISTRY,
  getAllCategories,
  getCategoryById,
  getSourcesByCategory,
  getAllEnabledSources,
  getCategoryCoverage,
};
