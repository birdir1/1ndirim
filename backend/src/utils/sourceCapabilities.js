const normalize = (name) =>
  name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

// hasScraper: true => scraper var (veya mevcutta çalışıyor)
// planned: true => henüz scraper yok, planlandı
// noCampaignPage: true => resmi kampanya sayfası yok / erişilemiyor
const CAPABILITIES = {
  // Mevcut aktif scrapers (bilinenler)
  akbank: { hasScraper: true },
  garanti: { hasScraper: true },
  yapikredi: { hasScraper: true },
  isbankasi: { hasScraper: true },
  isbank: { hasScraper: true },
  ziraat: { hasScraper: true },
  halkbank: { hasScraper: true },
  vakifbank: { hasScraper: true },
  denizbank: { hasScraper: true },
  qnbfinansbank: { hasScraper: true },
  teb: { hasScraper: true },
  ingbank: { hasScraper: true },
  kuveytturk: { hasScraper: true },
  albarakaturk: { hasScraper: true },
  turkiyefinans: { hasScraper: true },
  vakifkatilim: { hasScraper: true },
  ziraatkatilim: { hasScraper: true },
  emlakkatilim: { hasScraper: true },
  enpara: { hasScraper: true },
  cepteteb: { hasScraper: true },
  nkolay: { hasScraper: true },
  pttcell: { hasScraper: true },
  turkcell: { hasScraper: true },
  vodafone: { hasScraper: true },
  turktelekom: { hasScraper: true },
  papara: { hasScraper: true },
  paycell: { hasScraper: true },
  tosla: { hasScraper: true },
  bkmexpress: { hasScraper: true },

  // İstenilen yeni/eksik bankalar (şimdilik planlandı, scraper yok)
  sekerbank: { hasScraper: false, planned: true },
  fibabanka: { hasScraper: false, planned: true },
  anadolubank: { hasScraper: false, planned: true },
  alternatifbank: { hasScraper: false, planned: true },
  odeabank: { hasScraper: false, planned: true },
  icbc: { hasScraper: false, planned: true },
  burqanbank: { hasScraper: false, planned: true }, // typo guard
  burganbank: { hasScraper: false, planned: true },
  turkishbank: { hasScraper: false, planned: true },
  hsbc: { hasScraper: false, planned: true },
  hayatfinans: { hasScraper: false, planned: true },
  tombank: { hasScraper: false, planned: true, noCampaignPage: true },
};

function getCapability(name) {
  const norm = normalize(name);
  return CAPABILITIES[norm] || { hasScraper: true, planned: false };
}

module.exports = { getCapability };
