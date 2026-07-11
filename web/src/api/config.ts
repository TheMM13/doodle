// Empty string means "same origin as the page" -- correct for production,
// where the backend serves this app's static build itself. Local dev sets
// VITE_API_URL in web/.env to point at the separately-running dev backend.
export const API_URL = import.meta.env.VITE_API_URL ?? "";
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
