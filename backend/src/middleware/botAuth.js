const crypto = require('crypto');

function getBotTokenFromReq(req) {
  // Standard header: x-bot-token
  // Backward-compat: x-internal-bot-token
  return (
    req.get('x-bot-token') ||
    req.get('x-internal-bot-token') ||
    null
  );
}

function hasValidBotToken(req) {
  const expected = process.env.INTERNAL_BOT_TOKEN;
  const provided = getBotTokenFromReq(req);
  if (!expected || !provided) return false;

  const expectedBuf = Buffer.from(String(expected), 'utf8');
  const providedBuf = Buffer.from(String(provided), 'utf8');
  if (expectedBuf.length !== providedBuf.length) return false;

  try {
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch (_) {
    return false;
  }
}

function normalizeIp(ip) {
  if (!ip) return null;
  // Common Node/Express forms:
  // - ::1
  // - ::ffff:127.0.0.1
  // - 127.0.0.1
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice('::ffff:'.length);
  return ip;
}

function isPrivateOrLoopbackIp(ipRaw) {
  const ip = normalizeIp(ipRaw);
  if (!ip) return false;

  // IPv6 basic checks
  if (ip.includes(':')) {
    if (ip === '::1') return true;
    const lowered = ip.toLowerCase();
    // fc00::/7 (ULA), fe80::/10 (link-local)
    return lowered.startsWith('fc') || lowered.startsWith('fd') || lowered.startsWith('fe80:');
  }

  // IPv4 checks
  const parts = ip.split('.').map((p) => Number(p));
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return false;

  const [a, b] = parts;
  if (a === 127) return true; // loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  return false;
}

function getRemoteAddress(req) {
  return req.socket?.remoteAddress || req.connection?.remoteAddress || null;
}

function isTrustedBotRequest(req) {
  // IMPORTANT: Do NOT use X-Forwarded-For here; it's client-controlled unless a trusted proxy strips it.
  // This is a strict server-side check: token + safe source IP (private network or localhost).
  return hasValidBotToken(req) && isPrivateOrLoopbackIp(getRemoteAddress(req));
}

function requireBotAuth(req, res, next) {
  // Fail-closed if not configured.
  if (!process.env.INTERNAL_BOT_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Bot authentication is not configured',
    });
  }

  const provided = getBotTokenFromReq(req);
  if (!provided) {
    return res.status(401).json({
      success: false,
      error: 'Bot token required',
    });
  }

  if (!hasValidBotToken(req)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid bot token',
    });
  }

  return next();
}

module.exports = {
  requireBotAuth,
  isTrustedBotRequest,
};

