import type { FileItems } from "../domain";
import type { AbsoluteFsPath } from "../lib/fs-path";

export type PathFilter = (path: AbsoluteFsPath) => boolean;

interface FSysPort {
	getStatEntryType: (path: AbsoluteFsPath) => Promise<"file" | "dir" | "unknown">;
	readFile: (path: AbsoluteFsPath) => Promise<string>;
	readDir: (path: AbsoluteFsPath) => Promise<AbsoluteFsPath[]>;
}

interface Params {
	paths: AbsoluteFsPath[];
	fSysPort: FSysPort;
	pathFilter: PathFilter;
}

class FileItemsGenerator {
	#paths;
	#fSysPort;
	#pathFilter;
	#loadedPaths = new Set<AbsoluteFsPath>();

	constructor({ paths, fSysPort, pathFilter }: Params) {
		this.#paths = paths;
		this.#fSysPort = fSysPort;
		this.#pathFilter = pathFilter;
	}

	// biome-ignore lint/suspicious/useAwait: <explanation>
	async *generate() {
		yield* this.#generateFileItems(this.#paths);

		this.#loadedPaths.clear();
	}

	async *#generateFileItems(paths: AbsoluteFsPath[]): FileItems {
		for (const path of paths) {
			if (this.#loadedPaths.has(path)) {
				continue;
			}

			this.#loadedPaths.add(path);

			const statEntryType = await this.#fSysPort.getStatEntryType(path);

			if (statEntryType === "file") {
				if (!this.#pathFilter(path)) {
					continue;
				}

				const content = await this.#fSysPort.readFile(path);
				yield { path, content };
			}

			if (statEntryType === "dir") {
				const subPaths = await this.#fSysPort.readDir(path);

				yield* this.#generateFileItems(subPaths);
			}
		}
	}
}

// biome-ignore lint/suspicious/useAwait: <explanation>
export async function* createFileItemsGenerator(params: Params): FileItems {
	const fileItemsGenerator = new FileItemsGenerator(params);
	yield* fileItemsGenerator.generate();
}
