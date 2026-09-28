const DB_NAME = "image-fixr-db";
const STORE_NAME = "images";
const DB_VERSION = 1;

export const DEFAULT_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface StoredImageRecord {
  buffer: ArrayBuffer;
  name: string;
  type: string;
  persist: boolean;
  lastAccess: number;
  ttlMs?: number;
}

export function isRecordExpired(
  record: Pick<StoredImageRecord, 'persist' | 'lastAccess' | 'ttlMs'>,
  now = Date.now()
): boolean {
  if (record.persist) return false;
  const ttl = record.ttlMs ?? DEFAULT_SESSION_DURATION_MS;
  return now - record.lastAccess > ttl;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveImageStorage(
  key: "foreground" | "background",
  file: File,
  options: { persist?: boolean; ttlMs?: number } = {},
): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const record: StoredImageRecord = {
      buffer: arrayBuffer,
      name: file.name,
      type: file.type || "image/png",
      persist: options.persist ?? (key === "background"),
      lastAccess: Date.now(),
      ttlMs: options.ttlMs ?? DEFAULT_SESSION_DURATION_MS,
    };

    store.put(record, key);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to save image to IndexedDB:", error);
  }
}

export async function loadImageStorage(
  key: "foreground" | "background",
): Promise<{ file: File; name: string; persist: boolean } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result as StoredImageRecord | undefined;
        if (!result || !result.buffer) {
          resolve(null);
          return;
        }

        if (isRecordExpired(result)) {
          void deleteImageStorage(key);
          resolve(null);
          return;
        }

        // Refresh lastAccess timestamp in background
        void updateImageAccess(key);

        const file = new File([result.buffer], result.name, {
          type: result.type || "image/png",
        });
        resolve({
          file,
          name: result.name,
          persist: result.persist ?? (key === "background"),
        });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load image from IndexedDB:", error);
    return null;
  }
}

export async function setImagePersistence(
  key: "foreground" | "background",
  persist: boolean,
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result as StoredImageRecord | undefined;
      if (result) {
        result.persist = persist;
        result.lastAccess = Date.now();
        store.put(result, key);
      }
    };
  } catch (error) {
    console.error("Failed to update image persistence in IndexedDB:", error);
  }
}

async function updateImageAccess(key: "foreground" | "background"): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => {
      const result = request.result as StoredImageRecord | undefined;
      if (result) {
        result.lastAccess = Date.now();
        store.put(result, key);
      }
    };
  } catch {
    // Silent access touch
  }
}

export async function deleteImageStorage(
  key: "foreground" | "background",
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to delete image from IndexedDB:", error);
  }
}
