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

  // İstenilen bankalar: scrapers eklendi
  sekerbank: { hasScraper: true },
  fibabanka: { hasScraper: true },
  anadolubank: { hasScraper: true },
  alternatifbank: { hasScraper: true },
  odeabank: { hasScraper: true },
  // Aliases: normalization removes spaces, so keep exact normalized keys too.
  icbc: { hasScraper: true },
  icbcturkeybank: { hasScraper: true },
  burqanbank: { hasScraper: true }, // typo guard
  burganbank: { hasScraper: true },
  turkishbank: { hasScraper: true },
  hsbc: { hasScraper: true },
  hsbcturkiye: { hasScraper: true },
  hayatfinans: { hasScraper: true },
  tombank: { hasScraper: true },
};

function getCapability(name) {
  const norm = normalize(name);
  return CAPABILITIES[norm] || { hasScraper: true, planned: false };
}

module.exports = { getCapability };
