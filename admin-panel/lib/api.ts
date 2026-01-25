const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || '';

function headers(auth: { admin_email: string; admin_api_key: string }): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-admin-email': auth.admin_email,
    'x-admin-api-key': auth.admin_api_key,
  };
}

export async function apiFetch<T>(
  path: string,
  auth: { admin_email: string; admin_api_key: string },
  opts?: RequestInit
): Promise<{ data?: T; error?: string; message?: string; status: number }> {
  const url = `${BASE.replace(/\/$/, '')}/api/admin${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...opts,
    headers: { ...headers(auth), ...(opts?.headers as Record<string, string>) },
  });
  const body = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    return { error: body || 'Invalid JSON', status: res.status };
  }
  if (!res.ok) {
    const err = (json as { error?: string }).error || (json as { message?: string }).message || body;
    return { error: String(err), message: (json as { message?: string }).message as string | undefined, status: res.status };
  }
  return { data: (json as { data?: T }).data ?? (json as T), status: res.status };
}

export function apiUrl(path: string): string {
  return `${BASE.replace(/\/$/, '')}/api/admin${path.startsWith('/') ? path : `/${path}`}`;
}
