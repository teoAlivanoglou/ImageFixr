const DB_NAME = "image-fixr-db";
const STORE_NAME = "images";
const DB_VERSION = 1;

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
): Promise<void> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    store.put(
      {
        buffer: arrayBuffer,
        name: file.name,
        type: file.type,
      },
      key,
    );

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
): Promise<{ file: File; name: string } | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        const file = new File([result.buffer], result.name, {
          type: result.type || "image/png",
        });
        resolve({ file, name: result.name });
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load image from IndexedDB:", error);
    return null;
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
