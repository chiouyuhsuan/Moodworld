// Tiny helper: `node db/run.mjs db/schema.sql` — runs a .sql file against
// DATABASE_URL. Used by `npm run db:migrate` / `npm run db:seed`. Loads
// .env.local if present (no extra dependency — minimal manual parse).
import { readFileSync, existsSync } from "node:fs";
import { Client } from "pg";

function loadEnvLocal() {
  for (const f of [".env.local", ".env"]) {
    if (existsSync(f)) {
      for (const line of readFileSync(f, "utf8").split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

async function main() {
  loadEnvLocal();
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node db/run.mjs <path-to-sql-file>");
    process.exit(1);
  }
  const sql = readFileSync(file, "utf8");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set (check .env.local).");
    process.exit(1);
  }
  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log(`Ran ${file} OK`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
