const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!rawApiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL environment variable.");
}

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
