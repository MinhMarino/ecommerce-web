const API_URL =
  import.meta.env.VITE_API_URL || "https://ecommerce-api-kn26.onrender.com";

type RequestOpts = RequestInit & { auth?: boolean; guest?: boolean };

function getAccessToken() {
  return localStorage.getItem("accessToken");
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
}

export function setUser(user: unknown) {
  if (!user) {
    localStorage.removeItem("user");
    return;
  }
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser<T = unknown>() {
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as T) : null;
}

function getGuestToken() {
  return localStorage.getItem("guestToken");
}

export function setGuestToken(token: string) {
  localStorage.setItem("guestToken", token);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  setUser(data.user);
  return data.accessToken as string;
}

export async function api<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers || {});
  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }

  if (opts.auth !== false) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const guest = getGuestToken();
  if (guest) headers.set("X-Guest-Token", guest);

  let res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const guestHeader = res.headers.get("X-Guest-Token");
  if (guestHeader) setGuestToken(guestHeader);

  if (res.status === 401 && opts.auth !== false && getRefreshToken()) {
    const next = await refreshAccessToken();
    if (next) {
      headers.set("Authorization", `Bearer ${next}`);
      res = await fetch(`${API_URL}${path}`, { ...opts, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

export { API_URL };
