/**
 * Campaign Normalizer
 * - Keeps rawContent (HTML/text) for audit
 * - Produces normalized content fields for API
 * - Adds rule-based validation; optional LLM enrichment
 */
const he = require('he');
const ai = require('./AIService');

function stripScriptsAndStyles(html = '') {
  // Remove <script>...</script> and <style>...</style> blocks completely
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
}

function stripTags(html = '') {
  return html.replace(/<\/?[^>]+(>|$)/g, ' ');
}

function normalizeWhitespace(text = '') {
  return text.replace(/\s+/g, ' ').trim();
}

function toPlainText({ rawHtml, rawText }) {
  if (rawText && rawText.trim().length > 0) return normalizeWhitespace(rawText);
  if (rawHtml) {
    const withoutScripts = stripScriptsAndStyles(rawHtml);
    return normalizeWhitespace(stripTags(withoutScripts));
  }
  return '';
}

function summarizeWithoutAI(plain) {
  const sentences = plain.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const title = sentences[0]?.slice(0, 140) || plain.slice(0, 140);
  const shortDescription = sentences.slice(0, 2).join(' ').slice(0, 260);
  const detailText = plain;
  return { title, shortDescription, detailText };
}

async function maybeUseAI(bankName, plain) {
  if (!ai.isEnabled() || plain.length < 50) return null;
  const prompt = `
Bankanın kampanya sayfasından alınan metni temizle ve aşağıdaki JSON formatında döndür.
Türkçe yaz. Rakamları, tutarları, tarihleri değiştirme, uydurma.
title: 6-14 kelime, faydayı net anlat (örn: "Michelin'de 4 taksit fırsatı").
subtitle: opsiyonel, 1 satır.
shortDescription: 1-2 cümle, toplam 40-160 karakter.
detailText: Kampanya koşullarını mümkün olduğunca tam ve satır satır (\\n ile) koru; cümle uydurma.
validUntil: varsa tarih (ISO veya dd.mm.yyyy).

JSON:
{
  "title": "",
  "subtitle": "",
  "shortDescription": "",
  "detailText": "",
  "validUntil": ""
}

Banka: ${bankName}
Ham metin:
${plain}
`;
  try {
    const res = await ai.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 600,
    });
    const content = res.choices?.[0]?.message?.content || '';
    const jsonStart = content.indexOf('{');
    const json = JSON.parse(content.slice(jsonStart));
    return json;
  } catch (e) {
    console.warn('AI normalize fallback to rule-based:', e.message);
    return null;
  }
}

function validateNormalized(normalized, raw) {
  const result = { isValid: true, needsReview: false, reason: null };
  const badTitles = ['kampanya', 'kampanyalar', 'kampanyalarımız', 'sizin için ne yapabilirim', 'sana nasıl yardımcı olabilirim'];
  const hasBadTitle = badTitles.some((t) => (normalized.title || '').toLowerCase().includes(t));
  const hasPlaceholder = /000\s*tl/i.test(`${normalized.title} ${normalized.detailText}`);
  const monthYearSlug = /\b(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\b.*\b20\d{2}\b/i;
  const looksLikeFilenameTitle = monthYearSlug.test(normalized.title || '') && (normalized.title || '').length < 50;
  if (!normalized.title || normalized.title.trim().length < 6 || hasBadTitle) {
    result.isValid = false;
    result.needsReview = true;
    result.reason = 'bad_title';
  } else if (looksLikeFilenameTitle) {
    result.isValid = false;
    result.needsReview = true;
    result.reason = 'title_looks_like_filename';
  } else if (hasPlaceholder) {
    result.isValid = false;
    result.needsReview = true;
    result.reason = 'placeholder_numbers';
  } else if ((normalized.detailText || '').length < 80 && (raw || '').length > 300) {
    result.isValid = false;
    result.needsReview = true;
    result.reason = 'detail_too_short';
  }
  return result;
}

async function normalizeCampaignText({ bankName, rawHtml, rawText, sourceUrl }) {
  const decodedHtml = he.decode(rawHtml || '');
  const plainText = toPlainText({ rawHtml: decodedHtml, rawText });

  // JS gürültüsünü temizle: function(), window., var gibi bloklar baskınsa kırp
  const jsNoisePattern = /(function\s*\(|window\.|document\.|var\s+[a-zA-Z_$])/i;
  const cleanedPlain = jsNoisePattern.test(plainText)
    ? plainText
        .split(/\n|;|\r/)
        .filter((line) => !jsNoisePattern.test(line))
        .join(' ')
        .trim()
    : plainText;

  let normalized =
    (await maybeUseAI(bankName, cleanedPlain)) ||
    summarizeWithoutAI(cleanedPlain || `${bankName} kampanyası`);

  // Fill defaults
  normalized = {
    title: normalized.title ? normalizeWhitespace(normalized.title) : '',
    subtitle: normalized.subtitle ? normalizeWhitespace(normalized.subtitle) : '',
    shortDescription: normalized.shortDescription ? normalizeWhitespace(normalized.shortDescription) : '',
    detailText: normalized.detailText ? normalized.detailText.trim() : cleanedPlain,
    validUntil: normalized.validUntil || '',
    minSpend: normalized.minSpend || '',
    discountAmount: normalized.discountAmount || '',
    discountRate: normalized.discountRate || '',
    tags: normalized.tags || [],
  };

  const validation = validateNormalized(normalized, cleanedPlain);

  return {
    sourceUrl,
    rawContent: decodedHtml || plainText,
    normalizedContent: normalized,
    isValid: validation.isValid,
    needsReview: validation.needsReview,
    invalidReason: validation.reason,
  };
}

module.exports = {
  normalizeCampaignText,
};
