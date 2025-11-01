import { crawlServers } from "@lib/servers/crawl";
import { ServerRepository } from "@lib/servers/repository";
import { serverStatics, type ServerStatics } from "@lib/servers/types";
import type { NS } from "@ns";

const getServers = (ns: NS): readonly ServerStatics[] => {
  const servers: ServerStatics[] = [];
  const purchasedServers = ns.getPurchasedServers();

  for (const host of crawlServers(ns)) {
    const server = ns.getServer(host);
    servers.push(serverStatics(server, purchasedServers));
  }

  return servers;
};

export async function main(ns: NS): Promise<void> {
  using db = await ServerRepository.open();
  const servers = getServers(ns);
  db.update(servers, { clear: true });
}
