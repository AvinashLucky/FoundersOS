import { MongoClient, type Db } from "mongodb";

/**
 * Lazy MongoDB connection.
 * ─────────────────────────────────────────────────────────────────────────
 * • If MONGODB_URI is set → we connect to the real database.
 * • If it's NOT set → repositories use an in-memory fallback (see repos), so
 *   the whole app runs locally with zero setup. Set the env var to go real.
 * The client is cached on `globalThis` so Next.js hot-reload doesn't open a new
 * connection on every change (a classic dev memory leak).
 * ─────────────────────────────────────────────────────────────────────────
 */
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "founderos";

interface MongoCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}
const globalForMongo = globalThis as unknown as { __mongo?: MongoCache };
const cache: MongoCache = (globalForMongo.__mongo ??= { client: null, promise: null });

/** True when a real database is configured. */
export function hasMongo(): boolean {
  return Boolean(uri);
}

/** Get the connected Db, or throw if no URI is configured (callers guard with hasMongo). */
export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("MONGODB_URI is not set");
  if (!cache.client) {
    cache.promise ??= new MongoClient(uri).connect();
    cache.client = await cache.promise;
  }
  return cache.client.db(dbName);
}
