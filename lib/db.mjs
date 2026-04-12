/**
 * PostgreSQL pool — credentials only via process.env (see .env.example).
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[db] DATABASE_URL is not set. Copy .env.example to .env and add your connection string."
  );
}

/** @type {pg.Pool | null} */
let pool = null;

export function getPool() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Configure .env (see .env.example).");
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString,
      // Many hosted Postgres providers require TLS; adjust if your host uses verify-full.
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  return p.query(text, params);
}
