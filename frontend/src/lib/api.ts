const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setToken(token: string): void {
  localStorage.setItem("access_token", token);
}

export async function api<T>(
  path: string,
  opts: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token = getToken(), ...rest } = opts;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(rest.headers as object),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...rest, headers });
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
