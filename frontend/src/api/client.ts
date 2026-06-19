// Typed error so callers (and React Query) can distinguish a 401 from other failures.
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ApiErrorBody {
  message?: string;
}

/**
 * fetch wrapper for the same-origin API.
 * - Always relative `/api/...` paths (works behind the Vite proxy and Traefik).
 * - credentials:'include' so the httpOnly access_token cookie is sent.
 * - throws ApiError on non-2xx (status preserved for 401 redirect logic).
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as ApiErrorBody;
      if (body.message) {
        message = body.message;
      }
    } catch {
      // non-JSON error body — keep the status text
    }
    throw new ApiError(res.status, message);
  }

  // Some endpoints (e.g. logout) may return an empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
