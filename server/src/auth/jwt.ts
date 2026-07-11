import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface AppJwtPayload {
  userId: string;
  name: string;
  isGuest: boolean;
}

export function signAppJwt(payload: AppJwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "30d" });
}

export function verifyAppJwt(token: string): AppJwtPayload {
  return jwt.verify(token, env.jwtSecret) as AppJwtPayload;
}
