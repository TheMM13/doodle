import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({ connectionString: env.databaseUrl });

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]) {
  return pool.query<T>(text, params);
}
