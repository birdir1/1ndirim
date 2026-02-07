/**
 * Overlap lock: in-memory + filesystem.
 * Filesystem lock uses atomic create (O_EXCL) and stores pid/started_at.
 * Stale when PID dead, TTL exceeded, or lock content corrupt.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch (_) { return null; }
}

function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try { process.kill(pid, 0); return true; } catch (_) { return false; }
}

function readLockInfo(lockPath) {
  try { return safeJsonParse(fs.readFileSync(lockPath, 'utf8')); } catch (_) { return null; }
}

function isLockStale(lockPath, ttlMs) {
  try {
    const st = fs.statSync(lockPath);
    const age = Date.now() - st.mtimeMs;
    if (ttlMs && age > ttlMs) return true;
  } catch (_) {
    return true;
  }
  const info = readLockInfo(lockPath);
  if (!info) return true;
  if (!isPidAlive(Number(info.pid))) return true;
  return false;
}

function acquireFsLock(lockPath, { ttlMs = 2 * 60 * 60 * 1000, log = console } = {}) {
  const abs = path.isAbsolute(lockPath) ? lockPath : path.resolve(lockPath);
  const payload = { pid: process.pid, hostname: os.hostname(), started_at: new Date().toISOString(), argv: process.argv };

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const fd = fs.openSync(abs, 'wx');
      try { fs.writeFileSync(fd, JSON.stringify(payload), 'utf8'); } finally { try { fs.closeSync(fd); } catch (_) {} }
      const release = () => {
        try {
          const current = readLockInfo(abs);
          if (current && Number(current.pid) === process.pid) fs.unlinkSync(abs);
        } catch (_) {}
      };
      return { acquired: true, release, info: payload };
    } catch (e) {
      if (e && e.code === 'EEXIST') {
        const info = readLockInfo(abs);
        if (!isLockStale(abs, ttlMs)) return { acquired: false, info };
        try { log.warn(`⚠️ stale lock detected, removing: ${abs}`); fs.unlinkSync(abs); } catch (rmErr) { log.warn(`⚠️ failed to remove stale lock: ${rmErr && rmErr.message}`); return { acquired: false, info }; }
        continue;
      }
      log.warn(`⚠️ lock acquire error: ${abs} (${e && e.message})`);
      return { acquired: false };
    }
  }
  return { acquired: false };
}

async function withFsRunLock(fn, { lockPath = '/tmp/1ndirim-bot.lock', ttlMs, log = console } = {}) {
  const lock = acquireFsLock(lockPath, { ttlMs, log });
  if (!lock.acquired) return { skipped: true, lockInfo: lock.info || null };
  log.info(`RUN_LOCK_ACQUIRED lock_path=${lockPath} pid=${process.pid} ttl_ms=${ttlMs || 'n/a'}`);
  try { const result = await fn(); return { skipped: false, result }; } finally { try { lock.release && lock.release(); } catch (_) {} log.info(`RUN_LOCK_RELEASED lock_path=${lockPath} pid=${process.pid}`); }
}

module.exports = { acquireFsLock, withFsRunLock, isPidAlive };
