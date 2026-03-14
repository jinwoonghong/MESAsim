import type { Agent } from "@/types/agent";
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "mesasim-agents";
const DB_VERSION = 1;
const STORE_NAME = "agents";

interface MESAsimAgentsDB {
  agents: {
    key: string;
    value: Agent;
  };
}

async function getDB(): Promise<IDBPDatabase<MESAsimAgentsDB>> {
  return openDB<MESAsimAgentsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
}

export async function saveAgents(agents: Agent[]): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    // Clear existing data before saving
    await store.clear();

    for (const agent of agents) {
      await store.put(agent);
    }

    await tx.done;
  } catch (error: unknown) {
    console.warn(
      "[agent-storage] Failed to save agents:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function loadAgents(): Promise<Agent[]> {
  try {
    const db = await getDB();
    return await db.getAll(STORE_NAME);
  } catch (error: unknown) {
    console.warn(
      "[agent-storage] Failed to load agents:",
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

export async function clearAgents(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    await tx.objectStore(STORE_NAME).clear();
    await tx.done;
  } catch (error: unknown) {
    console.warn(
      "[agent-storage] Failed to clear agents:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
