import { OAuth2Client } from "google-auth-library";
import { env } from "../env.js";
import { query } from "../db.js";

const client = new OAuth2Client(env.googleClientId);

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleUser> {
  const ticket = await client.verifyIdToken({ idToken, audience: env.googleClientId });
  const payload = ticket.getPayload();
  if (!payload?.sub) throw new Error("Invalid Google token");
  return {
    googleId: payload.sub,
    email: payload.email ?? "",
    name: payload.name ?? payload.email?.split("@")[0] ?? "Player",
  };
}

export async function upsertGoogleUser(g: GoogleUser) {
  const existing = await query(`SELECT * FROM users WHERE google_id = $1`, [g.googleId]);
  if (existing.rows.length) return existing.rows[0];
  const inserted = await query(
    `INSERT INTO users (google_id, email, name, is_guest) VALUES ($1, $2, $3, FALSE) RETURNING *`,
    [g.googleId, g.email, g.name]
  );
  return inserted.rows[0];
}
