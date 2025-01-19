import type { FileItems } from "~/domain";

export type PathFilter = (path: string) => boolean;

interface FSysPort {
	getStatEntryType: (path: string) => Promise<"file" | "dir" | "unknown">;
	readFile: (path: string) => Promise<string>;
	readDir: (path: string) => Promise<string[]>;
}

interface Params {
	paths: string[];
	fSysPort: FSysPort;
	pathFilter: PathFilter;
}

class FileItemsGenerator {
	#paths;
	#fSysPort;
	#pathFilter;
	#loadedPaths = new Set<string>();

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

	async *#generateFileItems(paths: string[]): FileItems {
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
