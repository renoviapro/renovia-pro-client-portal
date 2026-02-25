const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access_token) {
      setToken(data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string | null; _retried?: boolean } = {}
): Promise<T> {
  const { token = getToken(), _retried = false, ...rest } = opts;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(rest.headers as object),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...rest, headers });
  
  if (res.status === 401 && !_retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return api<T>(path, { ...opts, token: newToken, _retried: true });
    }
    logout();
    throw new Error("Session expirée");
  }
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Erreur");
  }
  return res.json();
}

export async function apiForm(path: string, formData: FormData, token?: string | null) {
  const t = token ?? getToken();
  const headers: HeadersInit = t ? { Authorization: `Bearer ${t}` } : {};
  const res = await fetch(`${API}${path}`, { method: "POST", body: formData, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erreur");
  }
  return res.json();
}

export function apiUrl(path: string): string {
  const token = getToken();
  const url = new URL(`${API}${path}`, window.location.origin);
  if (token) url.searchParams.set("token", token);
  return url.toString();
}
