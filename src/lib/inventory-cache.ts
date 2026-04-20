// Tiny IndexedDB cache for read-only inventory access when offline.
const DB = "inventory-pulse";
const STORE = "inventory";
const KEY = "items";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheInventory(items: unknown[]) {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await open();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(items, KEY);
    await new Promise((res) => (tx.oncomplete = res));
    db.close();
  } catch { /* ignore */ }
}

export async function readCachedInventory<T = unknown>(): Promise<T[] | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await open();
    return await new Promise<T[] | null>((resolve) => {
      const req = db.transaction(STORE).objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as T[]) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}
