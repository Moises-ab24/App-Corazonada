import { Surreal } from 'surrealdb';

const ENDPOINT = import.meta.env.VITE_SURREALDB_ENDPOINT;
const NAMESPACE = import.meta.env.VITE_SURREALDB_NAMESPACE;
const DATABASE = import.meta.env.VITE_SURREALDB_DATABASE;
const USERNAME = import.meta.env.VITE_SURREALDB_USERNAME;
const PASSWORD = import.meta.env.VITE_SURREALDB_PASSWORD;

let db: Surreal | null = null;
let connectionPromise: Promise<Surreal> | null = null;

export async function getSurrealDB(): Promise<Surreal> {
  if (db) return db;
  if (connectionPromise) return connectionPromise;

  connectionPromise = (async (): Promise<Surreal> => {
    try {
      const newDb = new Surreal();
      await newDb.connect(ENDPOINT, {
        namespace: NAMESPACE,
        database: DATABASE,
      });
      await newDb.signin({
        username: USERNAME,
        password: PASSWORD,
      });
      db = newDb;
      console.log('SurrealDB conectado ✓');
      return db;
    } catch (error) {
      console.error('Error conectando SurrealDB:', error);
      db = null;
      throw error;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export async function disconnectSurrealDB(): Promise<void> {
  if (db) {
    try {
      await db.close();
    } catch (e) {
      console.error(e);
    } finally {
      db = null;
    }
  }
}
