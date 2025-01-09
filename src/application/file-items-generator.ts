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

async function* generateFileItems(
	{ paths, pathFilter, fSysPort }: Params,
	loadedPaths: Set<AbsoluteFsPath>,
): FileItems {
	for (const path of paths) {
		if (loadedPaths.has(path)) {
			continue;
		}

		loadedPaths.add(path);

		const statEntryType = await fSysPort.getStatEntryType(path);

		if (statEntryType === "file") {
			if (!pathFilter(path)) {
				continue;
			}

			const content = await fSysPort.readFile(path);
			yield { path, content };
		}

		if (statEntryType === "dir") {
			const subPaths = await fSysPort.readDir(path);

			yield* generateFileItems({ paths: subPaths, pathFilter, fSysPort }, loadedPaths);
		}
	}
}

// biome-ignore lint/suspicious/useAwait: <explanation>
export async function* createFileItemsGenerator(params: Params): FileItems {
	const loadedPaths = new Set<AbsoluteFsPath>();

	yield* generateFileItems(params, loadedPaths);

	loadedPaths.clear();
}
