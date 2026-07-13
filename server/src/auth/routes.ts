import { Router } from "express";
import { z } from "zod";
import { signAppJwt } from "./jwt.js";
import { query } from "../db.js";

export const authRouter = Router();

// Guest accounts are free to mint, so an unthrottled endpoint is an easy
// way to bloat the users table and hand out unlimited tokens. Fixed-window
// per-IP limit, pruned lazily so the map can't grow without bound.
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, { count: number; windowStart: number }>();

function allowRequest(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 10_000) {
    for (const [key, entry] of hits) {
      if (now - entry.windowStart > WINDOW_MS) hits.delete(key);
    }
  }
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= MAX_PER_WINDOW;
}

const guestBody = z.object({ name: z.string().trim().min(1).max(20) });

authRouter.post("/guest", async (req, res) => {
  if (!allowRequest(req.ip ?? "unknown")) {
    return res.status(429).json({ error: "Too many accounts created — try again later" });
  }
  const parsed = guestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "name required" });

  try {
    const inserted = await query(
      `INSERT INTO users (name, is_guest) VALUES ($1, TRUE) RETURNING *`,
      [parsed.data.name]
    );
    const user = inserted.rows[0];
    const token = signAppJwt({ userId: user.id, name: user.name, isGuest: true });
    res.json({ token, user: { id: user.id, name: user.name, avatar: user.avatar } });
  } catch (err) {
    console.error("Guest login failed", err);
    res.status(503).json({ error: "Service unavailable, try again shortly" });
  }
});
