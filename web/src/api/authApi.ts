import { API_URL } from "./config";

export interface AuthUser {
  id: string;
  name: string;
  avatar: { face: number };
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export function loginAsGuest(name: string, avatar?: AuthUser["avatar"]) {
  return post<AuthResponse>("/auth/guest", { name, avatar });
}