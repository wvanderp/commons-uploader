import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'ImageSetDB';
const STORE_NAME = 'ImageSetStore';
const DB_VERSION = 1;

const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const indexedDBStorage: StateStorage = {
    async getItem(name: string): Promise<string | null> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(name);
            request.onsuccess = () => resolve(request.result as string || null);
            request.onerror = () => reject(request.error);
        });
    },
    async setItem(name: string, value: string): Promise<void> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, name);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    async removeItem(name: string): Promise<void> {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(name);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
};
