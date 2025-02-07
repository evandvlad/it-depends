import type { EventBusDispatcher } from "~/lib/event-bus";
import { getName } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import type { PathFilter } from "~/values";

export type DispatcherPort = EventBusDispatcher<{
	"program-files-loading:started": [];
	"program-files-loading:program-file-loaded": [{ path: string }];
	"program-files-loading:directory-entered": [{ path: string }];
	"program-files-loading:path-rejected": [{ path: string }];
	"program-files-loading:finished": [];
}>;

type Result = Rec<string, string>;

export interface FSysPort {
	getStatEntryType: (path: string) => Promise<"file" | "dir" | "unknown">;
	readFile: (path: string) => Promise<string>;
	readDir: (path: string) => Promise<string[]>;
}

interface Params {
	fSysPort: FSysPort;
	dispatcherPort: DispatcherPort;
	pathFilter: PathFilter;
}

export class ProgramFilesLoader {
	#fSysPort;
	#pathFilter;
	#dispatcherPort;

	constructor({ fSysPort, pathFilter, dispatcherPort }: Params) {
		this.#fSysPort = fSysPort;
		this.#pathFilter = pathFilter;
		this.#dispatcherPort = dispatcherPort;
	}

	async load(paths: string[]) {
		const result: Result = new Rec();

		this.#dispatcherPort.dispatch("program-files-loading:started");

		for await (const path of paths) {
			await this.#load(path, result);
		}

		this.#dispatcherPort.dispatch("program-files-loading:finished");

		return result;
	}

	async #load(path: string, result: Result): Promise<void> {
		const statEntryType = await this.#fSysPort.getStatEntryType(path);
		const isFile = statEntryType === "file";

		if (isFile && result.has(path)) {
			return;
		}

		if (!this.#pathFilter({ path, isFile, name: getName(path) })) {
			this.#dispatcherPort.dispatch("program-files-loading:path-rejected", { path });
			return;
		}

		if (isFile) {
			const content = await this.#fSysPort.readFile(path);
			result.set(path, content);

			this.#dispatcherPort.dispatch("program-files-loading:program-file-loaded", { path });
		}

		if (statEntryType === "dir") {
			const subPaths = await this.#fSysPort.readDir(path);

			this.#dispatcherPort.dispatch("program-files-loading:directory-entered", { path });

			for await (const subPath of subPaths) {
				await this.#load(subPath, result);
			}
		}
	}
}
