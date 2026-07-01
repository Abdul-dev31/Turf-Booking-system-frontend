import axios from "axios";

const DEFAULT_API_BASE = import.meta.env.DEV
  ? ""
  : "https://turf-booking-system-2-ucet.onrender.com";

export const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_API_BASE;

axios.defaults.baseURL = API_BASE;

export function apiFetch(path, options) {
  if (!path || typeof path !== "string") {
    throw new Error("apiFetch requires a string path");
  }

  const url = path.startsWith("http://") || path.startsWith("https://")
    ? path
    : `${API_BASE}${path}`;

  return fetch(url, options);
}
