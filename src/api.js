const DEFAULT_API_BASE = "https://turf-booking-system-1-hhe5.onrender.com";

export const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_API_BASE;

export function apiFetch(path, options) {
  if (!path || typeof path !== "string") {
    throw new Error("apiFetch requires a string path");
  }

  const url = path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${API_BASE}${path}`;

  return fetch(url, options);
}
