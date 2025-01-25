import { getName } from "~/lib/fs-path";
import type { PathFilter } from "~/values";

type ProgramFileItems = AsyncGenerator<{ path: string; content: string }>;

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

class ProgramFileItemsGenerator {
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
		yield* this.#generateProgramFileItems(this.#paths);

		this.#loadedPaths.clear();
	}

	async *#generateProgramFileItems(paths: string[]): ProgramFileItems {
		for (const path of paths) {
			if (this.#loadedPaths.has(path)) {
				continue;
			}

			this.#loadedPaths.add(path);

			const statEntryType = await this.#fSysPort.getStatEntryType(path);
			const isFile = statEntryType === "file";

			if (!this.#pathFilter({ path, isFile, name: getName(path) })) {
				continue;
			}

			if (isFile) {
				const content = await this.#fSysPort.readFile(path);
				yield { path, content };
			}

			if (statEntryType === "dir") {
				const subPaths = await this.#fSysPort.readDir(path);

				yield* this.#generateProgramFileItems(subPaths);
			}
		}
	}
}

// biome-ignore lint/suspicious/useAwait: <explanation>
export async function* createProgramFileItemsGenerator(params: Params): ProgramFileItems {
	const generator = new ProgramFileItemsGenerator(params);
	yield* generator.generate();
}
