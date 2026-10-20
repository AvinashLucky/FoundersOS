import { randomUUID } from "node:crypto";
import { getDb, hasMongo } from "../db/mongo";
import type { CreateListingBody, UpdateListingBody } from "../validation/listings.schema";
import type { Listing, ListingPlatform } from "@features/freelance/types";

/**
 * Listings repository — same seam as projects/runs/notes: the route handlers
 * depend on this interface, in-memory by default, MongoDB when configured,
 * every query workspace-scoped.
 */
export interface ListingsRepository {
  list(workspaceId: string): Promise<Listing[]>;
  create(workspaceId: string, input: CreateListingBody): Promise<Listing>;
  update(workspaceId: string, id: string, patch: UpdateListingBody): Promise<Listing | null>;
  remove(workspaceId: string, id: string): Promise<boolean>;
}

type StoredListing = Listing & { workspaceId: string };
const strip = ({ workspaceId: _w, ...l }: StoredListing): Listing => l;

function newListing(workspaceId: string, input: CreateListingBody): StoredListing {
  const now = new Date().toISOString();
  return {
    id: `lst_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    workspaceId,
    title: input.title,
    kind: input.kind,
    pitch: input.pitch,
    priceUsd: input.priceUsd ?? 0,
    platforms: input.platforms,
    posted: {},
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}

/** Apply a patch: merge fields, toggle posted map, recompute status. */
function applyPatch(l: StoredListing, patch: UpdateListingBody): StoredListing {
  if (patch.title !== undefined) l.title = patch.title;
  if (patch.pitch !== undefined) l.pitch = patch.pitch;
  if (patch.priceUsd !== undefined) l.priceUsd = patch.priceUsd;
  if (patch.platforms !== undefined) l.platforms = patch.platforms;
  if (patch.posted) {
    for (const [platform, on] of Object.entries(patch.posted) as Array<[ListingPlatform, boolean]>) {
      if (on) l.posted[platform] = new Date().toISOString();
      else delete l.posted[platform];
    }
  }
  l.status = Object.keys(l.posted).length > 0 ? "posted" : "draft";
  l.updatedAt = new Date().toISOString();
  return l;
}

class InMemoryListingsRepository implements ListingsRepository {
  private store = new Map<string, StoredListing[]>();

  private bucket(workspaceId: string): StoredListing[] {
    let b = this.store.get(workspaceId);
    if (!b) {
      b = [];
      this.store.set(workspaceId, b);
    }
    return b;
  }

  async list(workspaceId: string): Promise<Listing[]> {
    return [...this.bucket(workspaceId)]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(strip);
  }
  async create(workspaceId: string, input: CreateListingBody): Promise<Listing> {
    const l = newListing(workspaceId, input);
    this.bucket(workspaceId).unshift(l);
    return strip(l);
  }
  async update(workspaceId: string, id: string, patch: UpdateListingBody): Promise<Listing | null> {
    const found = this.bucket(workspaceId).find((l) => l.id === id);
    if (!found) return null;
    return strip(applyPatch(found, patch));
  }
  async remove(workspaceId: string, id: string): Promise<boolean> {
    const bucket = this.bucket(workspaceId);
    const idx = bucket.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    bucket.splice(idx, 1);
    return true;
  }
}

class MongoListingsRepository implements ListingsRepository {
  private async col() {
    const db = await getDb();
    const col = db.collection<StoredListing>("listings");
    await col.createIndex({ workspaceId: 1, updatedAt: -1 });
    return col;
  }
  async list(workspaceId: string): Promise<Listing[]> {
    const col = await this.col();
    return (await col.find({ workspaceId }).sort({ updatedAt: -1 }).toArray()).map(strip);
  }
  async create(workspaceId: string, input: CreateListingBody): Promise<Listing> {
    const col = await this.col();
    const l = newListing(workspaceId, input);
    await col.insertOne(l);
    return strip(l);
  }
  async update(workspaceId: string, id: string, patch: UpdateListingBody): Promise<Listing | null> {
    const col = await this.col();
    const doc = await col.findOne({ workspaceId, id });
    if (!doc) return null;
    const next = applyPatch(doc, patch);
    await col.replaceOne({ workspaceId, id }, next);
    return strip(next);
  }
  async remove(workspaceId: string, id: string): Promise<boolean> {
    const col = await this.col();
    const res = await col.deleteOne({ workspaceId, id });
    return res.deletedCount > 0;
  }
}

const g = globalThis as unknown as { __listingsRepo?: InMemoryListingsRepository };
const memoryRepo = (g.__listingsRepo ??= new InMemoryListingsRepository());

export function getListingsRepository(): ListingsRepository {
  return hasMongo() ? new MongoListingsRepository() : memoryRepo;
}
