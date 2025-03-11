import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface IClaim {
    claim: string;
    assessment: string;
    summary: string;
    original_text: string;
    fixed_original_text: string;
    confidence_score: number;
    url_sources?: {
        title: string;
        url: string;
    }[];
    type?: string;
}

export interface IJinaClaim {
    factuality: number;
    reason: string;
    references: {
        isSupportive: boolean;
        keyQuote: string;
        url: string;
    }[],
    result: boolean;
    claim: string;
    original_text: string;
}


export type IFactVerification = {
    id?: number;
    content: string;
    exaFinalResults: IClaim[];
    jinaFinalResults: IJinaClaim[];
    date: string
}

const DB_NAME = 'ai-fact-verification-database';
const STORE_NAME = 'ai-fact-verification-store';

interface MyDB extends DBSchema {
    [STORE_NAME]: {
        key: number;
        value: IFactVerification
    };
}

export async function initDB(): Promise<IDBPDatabase<MyDB>> {
    const db = await openDB<MyDB>(DB_NAME, 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        },
    });
    return db;
}
let db: IDBPDatabase<MyDB> | null = null;

async function getDB(): Promise<IDBPDatabase<MyDB>> {
    if (!db) {
        db = await initDB();
    }
    return db;
}

export async function addData(data: IFactVerification): Promise<IFactVerification> {
    delete data.id;
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const id = await store.add(data);
    await tx.done;
    return { ...data, id };
}

export async function deleteData(id: number): Promise<IFactVerification[]> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).delete(id);
    await tx.done;
    return await getLsit()
}

export async function getLsit(): Promise<IFactVerification[]> {
    const db = await getDB();
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    const allRecords = await store.getAll();
    const data = allRecords.sort((a, b) => (b.id || 0) - (a.id || 0))
    return data;
}