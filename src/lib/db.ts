import { Pool } from "pg";

// One pooled connection, reused across API route invocations (Next.js keeps
// the module cache warm between requests on the same server/lambda instance).
// See ARCHITECTURE.md: one backend, one database, shared by every client.

declare global {
  // eslint-disable-next-line no-var
  var __moodworldPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and point it at your Postgres instance (see README.md)."
    );
  }
  return new Pool({
    connectionString,
    ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 5,
  });
}

export function getPool(): Pool {
  if (!global.__moodworldPool) {
    global.__moodworldPool = createPool();
  }
  return global.__moodworldPool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const res = await pool.query(text, params);
  return res.rows as T[];
}
