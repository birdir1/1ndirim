/**
 * Campaign Quality Filter
 * Düşük değerli, PR kampanyaları, önemsiz kampanyaları filtreler
 * Sadece gerçek değerli kampanyalar geçer
 */

/**
 * Kampanya kalitesini değerlendirir
 * @param {Object} campaign - Normalize edilmiş kampanya objesi
 * @returns {boolean} - true = kaliteli kampanya, false = düşük değerli
 */
function isHighQualityCampaign(campaign) {
  // PHASE 1 TEMPORARY: Quality filter TAMAMEN devre dışı
  // Tüm kampanyalar kabul ediliyor
  return true;
}

/**
 * Kampanyada gerçek değer olup olmadığını kontrol eder
 * @param {Object} campaign
 * @returns {boolean}
 */
function _hasRealValue(campaign) {
  const title = (campaign.title || '').toLowerCase();
  const description = (campaign.description || '').toLowerCase();
  const text = `${title} ${description}`;

  // İndirim yüzdesi
  const discountMatch = text.match(/(\d+)%/);
  if (discountMatch) {
    const discount = parseInt(discountMatch[1]);
    if (discount >= 10) {
      // %10 ve üzeri indirimler geçerli
      return true;
    }
  }

  // TL cinsinden değer (puan, cashback, hediye) - nokta/virgül formatını da destekle
  const tlMatch = text.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)\s*tl/i);
  if (tlMatch) {
    // Nokta ve virgülleri kaldır, sadece sayıları al
    const amountStr = tlMatch[1].replace(/[.,]/g, '');
    const amount = parseInt(amountStr, 10);
    if (amount >= 50) {
      // 50 TL ve üzeri değerler geçerli
      return true;
    }
  }

  // Özel değerli kampanyalar (uçuş, otel, büyük alışveriş)
  const highValueKeywords = [
    'uçuş',
    'otel',
    'tatil',
    'yurt dışı',
    'platinum',
    'elite',
    'black',
  ];

  for (const keyword of highValueKeywords) {
    if (text.includes(keyword)) {
      return true;
    }
  }

  return false;
}

/**
 * Kampanyadan değer miktarını çıkarır
 * @param {Object} campaign
 * @returns {number} - TL cinsinden değer
 */
function _extractValueAmount(campaign) {
  const title = (campaign.title || '').toLowerCase();
  const description = (campaign.description || '').toLowerCase();
  const text = `${title} ${description}`;

  // İndirim yüzdesinden tahmini değer (örnek: %50 indirim = 50 TL değer)
  const discountMatch = text.match(/(\d+)%/);
  if (discountMatch) {
    return parseInt(discountMatch[1]);
  }

  // TL cinsinden değer - nokta/virgül formatını da destekle
  const tlMatch = text.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)\s*tl/i);
  if (tlMatch) {
    // Nokta ve virgülleri kaldır, sadece sayıları al
    const amountStr = tlMatch[1].replace(/[.,]/g, '');
    return parseInt(amountStr, 10);
  }

  return 0;
}

/**
 * URL'in resmi kaynak URL'i olup olmadığını kontrol eder
 * @param {string} url
 * @returns {boolean}
 */
function _isOfficialUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Resmi domain'ler
  const officialDomains = [
    'akbank.com',
    'yapikredi.com.tr',
    'garantibbva.com.tr',
    'isbank.com.tr',
    'turkcell.com.tr',
    'vodafone.com.tr',
    'turktelekom.com.tr',
    'ziraatbank.com.tr', // FAZ 6.2.2: Ziraat Bankası eklendi
    'halkbank.com.tr', // FAZ 6.3: Halkbank eklendi (pasif)
    'vakifbank.com.tr', // FAZ 6.3: VakıfBank eklendi (pasif)
    'denizbank.com', // FAZ 6.4: DenizBank eklendi
    'qnbfinansbank.com', // FAZ 6.5.1: QNB Finansbank eklendi
    'qnb.com.tr', // FAZ 6.5.1: QNB Finansbank eklendi
    'teb.com.tr', // FAZ 6.5.2: TEB eklendi (pasif)
    'ing.com.tr', // FAZ 6.5.3: ING Bank eklendi
    'kuveytturk.com.tr', // FAZ 6.5.4: Kuveyt Türk eklendi
    'albaraka.com.tr', // FAZ 6.5.5: Albaraka Türk eklendi
    'turkiyefinans.com.tr', // FAZ 6.5.6: Türkiye Finans eklendi
    'vakifkatilim.com.tr', // FAZ 6.5.7: Vakıf Katılım eklendi
    'ziraatkatilim.com.tr', // FAZ 6.5.8: Ziraat Katılım eklendi
    'emlakkatilim.com.tr', // FAZ 6.5.9: Emlak Katılım eklendi
    'enpara.com', // FAZ 6.6.1: Enpara eklendi
    'cepteteb.com.tr', // FAZ 6.6.2: CEPTETEB eklendi
    'nkolay.com', // FAZ 6.6.3: N Kolay eklendi
    'pttcell.com.tr', // FAZ 6.7: PTTcell eklendi
  ];

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return officialDomains.some((domain) => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

/**
 * Kampanya listesini filtreler
 * @param {Array<Object>} campaigns
 * @returns {Array<Object>} - Sadece kaliteli kampanyalar
 */
function filterHighQualityCampaigns(campaigns) {
  return campaigns.filter((campaign) => isHighQualityCampaign(campaign));
}

module.exports = {
  isHighQualityCampaign,
  filterHighQualityCampaigns,
  _hasRealValue,
  _extractValueAmount,
  _isOfficialUrl,
};
