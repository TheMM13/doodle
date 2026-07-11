import { Router } from "express";
import { z } from "zod";
import { verifyGoogleIdToken, upsertGoogleUser } from "./google.js";
import { signAppJwt } from "./jwt.js";
import { query } from "../db.js";

export const authRouter = Router();

const googleBody = z.object({ idToken: z.string().min(10) });

authRouter.post("/google", async (req, res) => {
  const parsed = googleBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "idToken required" });

  try {
    const googleUser = await verifyGoogleIdToken(parsed.data.idToken);
    const user = await upsertGoogleUser(googleUser);
    const token = signAppJwt({ userId: user.id, name: user.name, isGuest: false });
    res.json({ token, user: { id: user.id, name: user.name, avatar: user.avatar } });
  } catch (err) {
    console.error("Google auth failed", err);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// Guest login lets people play (and lets you test) without Google credentials set up yet.
const guestBody = z.object({ name: z.string().min(1).max(20) });

authRouter.post("/guest", async (req, res) => {
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
