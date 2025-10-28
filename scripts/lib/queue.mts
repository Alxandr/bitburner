import EventEmitter from "events";

type DefaultEventMap = [never];
type Listener<K, T, F> = T extends DefaultEventMap
  ? F
  : K extends keyof T
    ? T[K] extends unknown[]
      ? (...args: T[K]) => void
      : never
    : never;
type Listener1<K, T> = Listener<K, T, (...args: any[]) => void>;

type EventQueueEvents = {
  empty: [];
  done: [queue: string];
};

const invokeLater = (
  emitter: EventEmitter,
  eventName: string,
  listener: (...args: any[]) => void,
  ...args: any[]
) => {
  setImmediate(() => {
    for (const l of emitter.rawListeners(eventName)) {
      if (l === listener || (l as any).listener === listener) {
        l(...args);
        return;
      }
    }
  });
};

export class EventQueue extends EventEmitter<EventQueueEvents> {
  #queues: Map<string, Promise<void>> = new Map();

  constructor() {
    super();

    super.on("newListener", (<K extends keyof EventQueueEvents>(
      eventName: K,
      listener: Listener1<K, EventQueueEvents>,
    ) => {
      if (eventName === "empty" && this.#queues.size === 0) {
        invokeLater(this, eventName, listener);
      }
    }) as never);
  }

  push(queue: string, run: () => Promise<void>): Promise<void> {
    let waitFor = this.#queues.get(queue);
    if (!waitFor) {
      waitFor = Promise.resolve();
    }

    const cont = () => run();
    const next = waitFor.then(cont, cont).then(() => {
      if (this.#queues.get(queue) === next) {
        this.#queues.delete(queue);
        this.emit("done", queue);
        if (this.#queues.size === 0) {
          this.emit("empty");
        }
      }
    });

    this.#queues.set(queue, next);
    return next;
  }

  // push(event: () => void): Promise<void> {
  //   return (this.#done = this.#done.then(() => event()));
  // }
}
