import { Db } from "../utils/db";
import { ServerStatics } from "./types";

const schema = Object.freeze({
  servers: {
    keyPath: "hostname",
    type: ServerStatics,
  },
});

export class ServerRepository implements Disposable {
  static async open(): Promise<ServerRepository> {
    const db = await Db.open("servers", 1, schema);
    return new ServerRepository(db);
  }

  readonly #db: Db<typeof schema>;

  constructor(db: Db<typeof schema>) {
    this.#db = db;
  }

  async update(
    servers: readonly ServerStatics[],
    options: { clear?: true } = {},
  ) {
    using store = this.#db.write("servers");

    if (options.clear) {
      await store.clear();
    }

    for (const server of servers) {
      await store.put(server);
    }

    store.commit();
  }

  async get(hostname: string): Promise<ServerStatics | null> {
    using store = this.#db.read("servers");
    return await store.get(hostname);
  }

  async getAll(): Promise<ServerStatics[]> {
    using store = this.#db.read("servers");
    return await store.getAll();
  }

  async getPurchased(): Promise<ServerStatics[]> {
    // todo: improve by only fetching wanted
    const all = await this.getAll();
    return all.filter((server) => server.purchased);
  }

  async getMonetaryServers(): Promise<ServerStatics[]> {
    const all = await this.getAll();
    return all.filter((s) => s.money.max > 0);
  }

  [Symbol.dispose]() {
    this.#db[Symbol.dispose]();
  }
}
