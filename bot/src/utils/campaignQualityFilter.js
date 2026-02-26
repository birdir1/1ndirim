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
  if (!campaign || typeof campaign !== 'object') return false;

  // Drop anchors/manuals from normal ingestion.
  if (campaign.campaignType === 'anchor' || campaign.isAnchor === true || campaign.manual === true) return false;

  const sourceName = (campaign.sourceName || '').toString().trim();
  const title = (campaign.title || '').toString().replace(/\s+/g, ' ').trim();
  const originalUrl = (campaign.originalUrl || campaign.campaignUrl || '').toString().trim();
  const description = (campaign.description || '').toString().replace(/\s+/g, ' ').trim();
  const detailText = (campaign.detailText || '').toString().replace(/\s+/g, ' ').trim();

  if (title.length < 5) return false;
  if (!_isValidHttpUrl(originalUrl)) return false;

  const blob = `${title}\n${description}\n${detailText}`.toLowerCase();
  if (_looksLikeCookieOrConsent(blob)) return false;

  const hasBody = description.length >= 20 || detailText.length >= 20;
  if (!hasBody) {
    const allowShort = new Set(['TEB']);
    if (!allowShort.has(sourceName)) return false;
  }

  if (sourceName !== 'TEB') {
    if (!_hasRealValue({ title, description, detailText })) return false;
  }

  return true;
}

/**
 * Returns a reason code when campaign is rejected by quality gate.
 * Returns null when campaign passes.
 * This is used for per-source run reporting (keep it coarse to avoid large refactors).
 * @param {Object} campaign
 * @returns {string|null}
 */
function getQualityRejectionReason(campaign) {
  if (!campaign || typeof campaign !== 'object') return 'invalid_object';
  if (campaign.campaignType === 'anchor' || campaign.isAnchor === true || campaign.manual === true) return 'anchor_manual';

  const sourceName = (campaign.sourceName || '').toString().trim();
  const title = (campaign.title || '').toString().replace(/\s+/g, ' ').trim();
  const originalUrl = (campaign.originalUrl || campaign.campaignUrl || '').toString().trim();
  const description = (campaign.description || '').toString().replace(/\s+/g, ' ').trim();
  const detailText = (campaign.detailText || '').toString().replace(/\s+/g, ' ').trim();

  if (title.length < 5) return 'title_short';
  if (!_isValidHttpUrl(originalUrl)) return 'url_invalid';

  const blob = `${title}\n${description}\n${detailText}`.toLowerCase();
  if (_looksLikeCookieOrConsent(blob)) return 'cookie_or_consent';

  const hasBody = description.length >= 20 || detailText.length >= 20;
  if (!hasBody) {
    const allowShort = new Set(['TEB']);
    if (!allowShort.has(sourceName)) return 'body_too_short';
  }

  if (sourceName !== 'TEB') {
    if (!_hasRealValue({ title, description, detailText })) return 'no_value_signal';
  }

  return null;
}

/**
 * Kampanyada gerçek değer olup olmadığını kontrol eder
 * @param {Object} campaign
 * @returns {boolean}
 */
function _hasRealValue(campaign) {
  const title = (campaign.title || '').toLowerCase();
  const description = (campaign.description || '').toLowerCase();
  // Value signals can live in long-form detailText, especially on bank campaign pages.
  // Include it here to avoid dropping valid campaigns before backend ingestion.
  const detailText = (campaign.detailText || '').toLowerCase();
  const text = `${title} ${description} ${detailText}`;

  // Finance/credit campaigns: low percentages can be meaningful when they represent interest rates.
  // Example: "%1,99 faiz" should be treated as a value signal even though it's < 10%.
  const hasCreditContext =
    text.includes('faiz') ||
    text.includes('kredi') ||
    text.includes('ihtiyac') ||
    text.includes('i̇htiyaç') ||
    text.includes('konut') ||
    text.includes('taşıt') ||
    text.includes('tasıt');
  const rateMatch = text.match(/%\s*(\d{1,2}(?:[.,]\d{1,2})?)/i) || text.match(/(\d{1,2}(?:[.,]\d{1,2})?)\s*%/i);
  if (hasCreditContext && rateMatch) return true;

  // İndirim yüzdesi
  const discountMatch = text.match(/(\d+)\s*%|%\s*(\d+)/);
  if (discountMatch) {
    const discount = parseInt(discountMatch[1] || discountMatch[2]);
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
    'bilet',
    'bileti',
    'havayolu',
    'hava yolu',
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

  // Finance/bank campaigns often advertise value without explicit TL/% in the first fold
  // (e.g. "taksit", "faizsiz", "puan/bonus"). Treat these as value signals.
  const bankValueKeywords = [
    'taksit',
    'vade farksiz',
    'vade farksız',
    'faizsiz',
    'faiz',
    'masrafsiz',
    'masrafsız',
    'komisyonsuz',
    'ücretsiz',
    'ucretsiz',
    'aidatsiz',
    'aidatsız',
    'puan',
    'bonus',
    'mil',
    'cashback',
    'iade',
    'kazanc',
    'kazanç',
    'indirim',
  ];
  for (const keyword of bankValueKeywords) {
    if (text.includes(keyword)) return true;
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
  const detailText = (campaign.detailText || '').toLowerCase();
  const text = `${title} ${description} ${detailText}`;

  // İndirim yüzdesinden tahmini değer (örnek: %50 indirim = 50 TL değer)
  const discountMatch = text.match(/(\d+)\s*%|%\s*(\d+)/);
  if (discountMatch) {
    return parseInt(discountMatch[1] || discountMatch[2]);
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

function _isValidHttpUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function _looksLikeCookieOrConsent(textLower) {
  if (!textLower) return false;
  const hasCookieWord = textLower.includes('çerez') || textLower.includes('cerez') || textLower.includes('cookie') || textLower.includes('consent');
  if (!hasCookieWord) return false;
  const hasAction = textLower.includes('kabul') || textLower.includes('reddet') || textLower.includes('onay') || textLower.includes('gizlilik') || textLower.includes('privacy') || textLower.includes('kvkk');
  if (!hasAction) return false;
  const hasValueSignal =
    /(\d+)\s*%/.test(textLower) ||
    /%(\d+)/.test(textLower) ||
    /(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+)\s*(tl|₺)/i.test(textLower) ||
    textLower.includes('cashback') ||
    textLower.includes('indirim');
  return !hasValueSignal;
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
  getQualityRejectionReason,
  _hasRealValue,
  _extractValueAmount,
  _isOfficialUrl,
};
