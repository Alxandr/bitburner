import { type } from "arktype";

type StoreSchema<T extends Record<string, any> = Record<string, any>> = {
  keyPath: string | readonly string[];
  indices?: Record<
    string,
    { readonly keyPath: string | readonly string[]; unique?: boolean }
  >;
  type: type.Any<T>;
};

export class Db<T extends Readonly<Record<string, StoreSchema>>>
  implements Disposable
{
  static open<T extends Readonly<Record<string, StoreSchema>>>(
    name: string,
    version: number,
    schema: T,
  ): Promise<Db<T>> {
    return new Promise<Db<T>>((resolve, reject) => {
      const request = indexedDB.open(name, version);

      request.addEventListener("upgradeneeded", () => {
        const db = request.result;

        for (const store of db.objectStoreNames) {
          db.deleteObjectStore(store);
        }

        for (const [name, storeSchema] of Object.entries(schema)) {
          const store = db.createObjectStore(name, {
            keyPath: storeSchema.keyPath as string | string[],
          });

          if (storeSchema.indices) {
            for (const [indexName, index] of Object.entries(
              storeSchema.indices,
            )) {
              store.createIndex(indexName, index.keyPath as string | string[], {
                unique: index.unique,
              });
            }
          }
        }
      });

      request.addEventListener("error", () => reject(request.error));
      request.addEventListener("success", () =>
        resolve(new Db(request.result, schema)),
      );
    });
  }

  readonly #db: IDBDatabase;
  readonly #schema: T;

  private constructor(db: IDBDatabase, schema: T) {
    this.#db = db;
    this.#schema = schema;

    this.#db.addEventListener("error", (evt) => {
      const err = (evt.target as IDBRequest).error;
      console.warn(err);
    });
  }

  read<S extends keyof T>(store: S): ReadStore<T[S]["type"]["infer"]> {
    const objStore = this.#db
      .transaction(store as string, "readonly")
      .objectStore(store as string);

    return new ReadStore(objStore, this.#schema[store]!.type) as any;
  }

  write<S extends keyof T>(store: S): WriteStore<T[S]["type"]["infer"]> {
    const tx = this.#db.transaction(store as string, "readwrite");
    const objStore = tx.objectStore(store as string);

    return new WriteStore(tx, objStore, this.#schema[store]!.type) as any;
  }

  [Symbol.dispose]() {
    this.#db.close();
  }
}

class ReadStore<T> implements Disposable {
  readonly #store: IDBObjectStore;
  readonly #type: type.Any<T>;

  constructor(store: IDBObjectStore, type: type.Any<T>) {
    this.#store = store;
    this.#type = type;
  }

  protected get store(): IDBObjectStore {
    return this.#store;
  }

  get(id: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const request = this.#store.get(id);

      request.addEventListener("error", () => reject(request.error));
      request.addEventListener("success", () => {
        const raw = request.result;
        if (raw === null || raw === undefined) {
          resolve(null);
        }

        const parsed = (0, this.#type)(raw);
        if (parsed instanceof type.errors) {
          reject(parsed.toTraversalError());
        } else {
          resolve(parsed as T);
        }
      });
    });
  }

  getAll(): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const ret: T[] = [];
      const request = this.#store.openCursor();

      request.addEventListener("error", () => reject(request.error));
      request.addEventListener("success", () => {
        const cursor = request.result;

        if (!cursor) {
          // end of items
          resolve(ret);
          return;
        }

        ret.push(cursor.value as T);
        cursor.continue();
      });
    });
  }

  [Symbol.dispose]() {}
}

class WriteStore<T> extends ReadStore<T> implements Disposable {
  readonly #tx: IDBTransaction;
  #committed = false;

  constructor(tx: IDBTransaction, store: IDBObjectStore, type: type.Any<T>) {
    super(store, type);
    this.#tx = tx;
  }

  put(value: T): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = this.store.put(value);

      request.addEventListener("error", () => reject(request.error));
      request.addEventListener("success", () => resolve());
    });
  }

  commit() {
    this.#tx.commit();
    this.#committed = true;
  }

  rollback() {
    this.#tx.abort();
    this.#committed = true;
  }

  override [Symbol.dispose]() {
    if (!this.#committed) {
      this.#tx.abort();
      this.#committed = true;
    }

    super[Symbol.dispose]();
  }
}
