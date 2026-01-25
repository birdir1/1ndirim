/** Auth stored in localStorage. Keys match backend headers. */
export type Auth = { admin_email: string; admin_api_key: string };

const KEY = 'admin_auth';

export function getAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return null;
    const parsed = JSON.parse(s) as Auth;
    if (!parsed.admin_email || !parsed.admin_api_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAuth(auth: Auth): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(auth));
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
