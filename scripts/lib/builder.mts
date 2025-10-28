import chokidar, { type FSWatcher } from "chokidar";
import EventEmitter from "events";
import { statSync } from "fs";
import {
  resolve as resolvePath,
  relative as relativePath,
  dirname,
} from "path";
import { EventQueue } from "./queue.mts";
import { createLogger } from "./log.mts";
import { type } from "arktype";

const log = createLogger("builder");

const TargetFile = type("string#target");
type TargetFile = typeof TargetFile.infer;

const DependencyFile = type("string#dependency");
type DependencyFile = typeof DependencyFile.infer;

const OutputFile = type("string#output").narrow((f, ctx) => {
  if (f.startsWith("/")) {
    return ctx.reject({
      expected: "relative path",
      actual: f,
    });
  }

  return true;
});
type OutputFile = typeof OutputFile.infer;

const targetFile = (fullPath: string): TargetFile =>
  TargetFile.assert(fullPath);
const dependencyFile = (fullPath: string): DependencyFile =>
  DependencyFile.assert(fullPath);
const outputFile = (relPath: string): OutputFile => OutputFile.assert(relPath);

class BuilderFile {
  readonly #builder: Builder;
  readonly #path: OutputFile;
  readonly #get: () => Bun.BuildArtifact | null;

  constructor(
    builder: Builder,
    path: OutputFile,
    get: () => Bun.BuildArtifact | null,
  ) {
    this.#builder = builder;
    this.#path = path;
    this.#get = get;
  }

  get path(): string {
    return this.#path;
  }

  get content(): Promise<string | null> {
    const output = this.#get();
    if (!output) return Promise.resolve(null);
    return output.text();
  }
}

export type { BuilderFile };

const banner = [
  `Symbol.metadata ??= Symbol.for("Symbol.metadata");`,
  `Symbol.dispose ??= Symbol.for("Symbol.dispose");`,
  `Symbol.asyncDispose ??= Symbol.for("Symbol.asyncDispose");`,
].join("\n");

interface BuilderEvents {
  built: [file: BuilderFile];
  deleted: [path: string];
  ready: [];
}

export class Builder extends EventEmitter<BuilderEvents> implements Disposable {
  readonly #watcher: FSWatcher;
  readonly #depWatcher: FSWatcher;
  readonly #dir: string;
  readonly #outDir: string;
  readonly #deps: Map<TargetFile, Set<DependencyFile>> = new Map();
  readonly #revDeps: Map<DependencyFile, Set<TargetFile>> = new Map();
  readonly #outputs: Map<TargetFile, readonly OutputFile[]> = new Map();
  readonly #contents: Map<OutputFile, Bun.BuildArtifact> = new Map();
  readonly #queue: EventQueue = new EventQueue();

  constructor(dir: string, outDir: string) {
    super({});

    this.#dir = dir;
    this.#outDir = outDir;
    this.#watcher = chokidar.watch(".", {
      cwd: dir,
      ignored: (path, stats) => {
        if (!stats) stats = statSync(path, { throwIfNoEntry: false });
        if (!stats) return false;
        if (stats.isDirectory()) return false;
        if (!stats.isFile()) return true;
        if (!path.endsWith(".tsx")) return true;
        return false;
      },

      awaitWriteFinish: true,
      ignoreInitial: false,
      atomic: true,
      alwaysStat: true,
    });

    this.#depWatcher = chokidar.watch([], {
      cwd: dir,
      ignored: (path, stats) => {
        if (!stats) stats = statSync(path, { throwIfNoEntry: false });
        if (!stats) return false;
        if (stats.isDirectory()) return false;
        if (!stats.isFile()) return true;
        if (!path.endsWith(".tsx")) return true;
        return false;
      },

      awaitWriteFinish: true,
      ignoreInitial: true,
      atomic: true,
      alwaysStat: true,
    });

    this.#watcher.on("add", (path) => {
      this.#onTargetAdded(targetFile(resolvePath(this.#dir, path)));
    });

    this.#watcher.on("unlink", (path) => {
      this.#onTargetDeleted(targetFile(resolvePath(this.#dir, path)));
    });

    this.#watcher.on("ready", () => {
      this.#queue.once("empty", () => {
        this.emit("ready");
      });
    });

    this.#depWatcher.on("change", (path) => {
      this.#onDependencyChanged(dependencyFile(resolvePath(this.#dir, path)));
    });

    this.#queue.on("done", (path) => {
      this.#onQueueDone(path);
    });
  }

  file(path: string): BuilderFile | null {
    const file = this.#contents.get(path as OutputFile);
    if (!file) return null;

    return new BuilderFile(
      this,
      path as OutputFile,
      () => this.#contents.get(path as OutputFile) || null,
    );
  }

  get files(): Iterable<BuilderFile> {
    return this.#getFiles();
  }

  *#getFiles(): Iterable<BuilderFile> {
    for (const path of this.#contents.keys()) {
      yield this.file(path)!;
    }
  }

  #onTargetAdded(path: TargetFile) {
    log.debug("file %s added", path);
    this.#queue.push(path, () => this.#build(path));
  }

  #onDependencyChanged(path: DependencyFile) {
    log.debug("dep %s modified", path);
    const targets = this.#revDeps.get(path);
    if (targets) {
      for (const target of targets) {
        this.#queue.push(target, () => this.#build(target));
      }
    }
  }

  #onTargetDeleted(path: TargetFile) {
    log.debug("file %s deleted", path);
    const relPath = path.replace(/\.tsx$/, ".js");
    this.emit("deleted", relPath);
  }

  #onBuilt(output: BuilderFile) {
    log.info("file %s built", output.path);
    this.emit("built", output);
  }

  #onQueueDone(path: string) {
    const target = targetFile(path);
    const outputs = this.#outputs.get(target);
    if (!outputs) return;

    for (const output of outputs) {
      this.#onBuilt(this.file(output)!);
    }
  }

  async #build(path: TargetFile) {
    const deps = new Set<DependencyFile>();
    let result: Bun.BuildOutput | null = null;

    const relPath = relativePath(this.#dir, path);
    const relDir = dirname(relPath);
    const outDir = resolvePath(this.#outDir, relDir);

    try {
      result = await Bun.build({
        entrypoints: [path],
        outdir: outDir,
        banner,
        plugins: [
          {
            name: "record-deps",
            setup(build) {
              build.onLoad({ filter: /.*/ }, (args) => {
                log.trace(`%s load %s`, path, args.path);
                deps.add(dependencyFile(args.path));
              });
            },
          },
        ],
      });
    } catch (e) {
      log.warn(e);
    }

    if (result === null) {
      return;
    }

    const outputArr: OutputFile[] = [];
    for (const output of result.outputs) {
      log.debug("%s output: %s", path, output.path);
      const relPath = relativePath(this.#outDir, output.path);
      const file = outputFile(relPath);
      this.#contents.set(file, output);
      outputArr.push(file);
    }

    this.#outputs.set(path, outputArr);
    const oldDeps = this.#deps.get(path);
    this.#deps.set(path, deps);

    if (oldDeps) {
      for (const dep of oldDeps.keys()) {
        if (!deps.has(dep)) {
          this.#removeRevDep(dep, path);
        }
      }
    }

    for (const dep of deps.keys()) {
      if (!oldDeps || !oldDeps.has(dep)) {
        this.#addRevDep(dep, path);
      }
    }
  }

  #addRevDep(dep: DependencyFile, path: TargetFile) {
    log.trace("%s added dependency: %s", path, dep);

    let revDeps = this.#revDeps.get(dep);
    if (!revDeps) {
      revDeps = new Set<TargetFile>();
      this.#revDeps.set(dep, revDeps);
    }

    if (revDeps.size === 0) {
      // start watching the file
      log.debug(`starting to watch %s`, dep);
      this.#depWatcher.add(dep);
    }

    revDeps.add(path);
  }

  #removeRevDep(dep: DependencyFile, path: TargetFile) {
    log.trace("%s removed dependency: %s", path, dep);

    let revDeps = this.#revDeps.get(dep);
    if (!revDeps) {
      revDeps = new Set<TargetFile>();
      this.#revDeps.set(dep, revDeps);
    }

    revDeps.delete(path);

    if (revDeps.size === 0) {
      // stop watching the file
      log.debug(`unwatch %s`, dep);
      this.#depWatcher.unwatch(dep);
    }
  }

  [Symbol.dispose]() {
    log.trace("dispose");

    if (!this.#watcher.closed) {
      this.#watcher.close();
      this.#revDeps.clear();
      this.#deps.clear();
    }

    if (!this.#depWatcher.closed) {
      this.#depWatcher.close();
    }
  }
}
