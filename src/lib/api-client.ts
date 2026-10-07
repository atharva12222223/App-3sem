"use client";

// Thin fetch wrapper. Session token lives in localStorage — acceptable for
// this boilerplate; move to an httpOnly cookie (NextAuth/iron-session)
// before production.
const TOKEN_KEY = "sv_token";
const ROLE_KEY = "sv_role";
const PHONE_KEY = "sv_phone";

export function saveSession(token: string, role: string, phone: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(PHONE_KEY, phone);
}

export function getSession() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  return {
    token,
    role: localStorage.getItem(ROLE_KEY) ?? "",
    phone: localStorage.getItem(PHONE_KEY) ?? "",
  };
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(PHONE_KEY);
}

export async function api<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    auth?: boolean;
    form?: FormData;
  } = {}
): Promise<T> {
  const { method = "GET", body, auth = false, form } = options;
  const headers: Record<string, string> = {};
  if (auth) {
    const session = getSession();
    if (session) headers.Authorization = `Bearer ${session.token}`;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(path, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}
