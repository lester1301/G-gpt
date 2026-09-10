// ==========================================
// CENTRAL APP CONFIG
// ==========================================
// Reads from .env (local dev) or the Vercel
// project's Environment Variables (production).
// Falls back to the live Render URL so the app
// still works even if the env var is missing.

export const API_URL =
  import.meta.env.VITE_API_URL || "https://g-gpt-backend.onrender.com";