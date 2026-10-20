import { randomUUID } from "node:crypto";
import { getDb, hasMongo } from "../db/mongo";

/**
 * Project memory — SEED (notes).
 * A project's first form of memory: simple, timestamped notes scoped to a
 * (workspace, project). This is the foundation the real Memory Engine grows
 * from later (embeddings, recall, consolidation). Same repository pattern as
 * projects: in-memory by default, MongoDB when configured.
 */
export interface Note {
  id: string;
  projectId: string;
  text: string;
  createdAt: string;
}

type StoredNote = Note & { workspaceId: string };

function newNote(workspaceId: string, projectId: string, text: string): StoredNote {
  return {
    id: `mem_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    workspaceId,
    projectId,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };
}
const strip = ({ workspaceId: _w, ...n }: StoredNote): Note => n;

export interface NotesRepository {
  list(workspaceId: string, projectId: string): Promise<Note[]>;
  add(workspaceId: string, projectId: string, text: string): Promise<Note>;
}

class InMemoryNotesRepository implements NotesRepository {
  private notes: StoredNote[] = [];
  async list(workspaceId: string, projectId: string): Promise<Note[]> {
    return this.notes
      .filter((n) => n.workspaceId === workspaceId && n.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(strip);
  }
  async add(workspaceId: string, projectId: string, text: string): Promise<Note> {
    const n = newNote(workspaceId, projectId, text);
    this.notes.unshift(n);
    return strip(n);
  }
}

class MongoNotesRepository implements NotesRepository {
  private async col() {
    const db = await getDb();
    const col = db.collection<StoredNote>("project_notes");
    await col.createIndex({ workspaceId: 1, projectId: 1, createdAt: -1 });
    return col;
  }
  async list(workspaceId: string, projectId: string): Promise<Note[]> {
    const col = await this.col();
    const docs = await col.find({ workspaceId, projectId }).sort({ createdAt: -1 }).toArray();
    return docs.map(strip);
  }
  async add(workspaceId: string, projectId: string, text: string): Promise<Note> {
    const col = await this.col();
    const n = newNote(workspaceId, projectId, text);
    await col.insertOne(n);
    return strip(n);
  }
}

const g = globalThis as unknown as { __notesRepo?: InMemoryNotesRepository };
const memoryRepo = (g.__notesRepo ??= new InMemoryNotesRepository());

export function getNotesRepository(): NotesRepository {
  return hasMongo() ? new MongoNotesRepository() : memoryRepo;
}
