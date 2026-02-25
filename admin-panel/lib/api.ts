const BASE = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || '';

function headers(auth: { admin_email: string; admin_api_key: string }): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-admin-email': auth.admin_email,
    'x-admin-api-key': auth.admin_api_key,
  };
}

type ApiEnvelope<T> = {
  data?: T;
  pagination?: unknown;
  error?: unknown;
  message?: unknown;
};

export async function apiFetch<T>(
  path: string,
  auth: { admin_email: string; admin_api_key: string },
  opts?: RequestInit
): Promise<{ data?: T; error?: string; message?: string; status: number; pagination?: unknown }> {
  const url = `${BASE.replace(/\/$/, '')}/api/admin${path.startsWith('/') ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...opts,
      headers: { ...headers(auth), ...(opts?.headers as Record<string, string>) },
    });
  } catch (error) {
    return {
      error: `Network error: ${(error as Error).message}`,
      message: 'Backend API erişilemedi',
      status: 0,
    };
  }
  const body = await res.text();
  let json: Record<string, unknown> = {};
  try {
    json = body ? JSON.parse(body) : {};
  } catch {
    return { error: body || 'Invalid JSON', status: res.status };
  }

  const pagination =
    (json as ApiEnvelope<unknown>).pagination ??
    ((json as ApiEnvelope<Record<string, unknown>>).data as Record<string, unknown> | undefined)?.pagination;

  if (!res.ok) {
    const err = (json as { error?: string }).error || (json as { message?: string }).message || body;
    return {
      error: String(err),
      message: (json as { message?: string }).message as string | undefined,
      status: res.status,
      pagination,
    };
  }
  return {
    data: (json as { data?: T }).data ?? (json as T),
    status: res.status,
    pagination,
  };
}

export function apiUrl(path: string): string {
  return `${BASE.replace(/\/$/, '')}/api/admin${path.startsWith('/') ? path : `/${path}`}`;
}
