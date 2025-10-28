export class Deferred<T> {
  #resolve: (value: T | PromiseLike<T>) => void;
  #reject: (reason?: any) => void;
  #promise: Promise<T>;

  constructor() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
  }

  get promise() {
    return this.#promise;
  }

  resolve(value: T | PromiseLike<T>) {
    this.#resolve(value);
  }

  reject(reason?: any) {
    this.#reject(reason);
  }
}
