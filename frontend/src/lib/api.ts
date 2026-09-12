/**
 * Centralised API base-URL helper.
 *
 * Set NEXT_PUBLIC_BACKEND_URL in .env.local (or your deployment environment).
 * Falls back to http://localhost:5000 so local dev works with zero config.
 */
export const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
