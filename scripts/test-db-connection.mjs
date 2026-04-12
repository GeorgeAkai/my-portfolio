import { getPool } from "../lib/db.mjs";

async function main() {
  const pool = getPool();
  const r = await pool.query("select current_database(), current_user, version()");
  console.log("Connected:", r.rows[0]);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
