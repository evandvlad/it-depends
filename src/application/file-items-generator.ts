import { readFile, readdir, stat } from "node:fs/promises";
import type { FileItems } from "../domain";
import { type AbsoluteFsPath, joinPaths } from "../lib/fs-path";

export type PathFilter = (path: AbsoluteFsPath) => boolean;

interface Params {
	paths: AbsoluteFsPath[];
	pathFilter: PathFilter;
}

async function* generateFileItems({ paths, pathFilter }: Params, loadedPaths: Set<AbsoluteFsPath>): FileItems {
	for (const path of paths) {
		if (loadedPaths.has(path)) {
			continue;
		}

		loadedPaths.add(path);

		const statEntry = await stat(path);

		if (statEntry.isFile()) {
			if (!pathFilter(path)) {
				continue;
			}

			const content = await readFile(path, "utf-8");
			yield { path, content };
		}

		if (statEntry.isDirectory()) {
			const names = await readdir(path);
			const subPaths = names.map((name) => joinPaths(path, name));

			yield* generateFileItems({ paths: subPaths, pathFilter }, loadedPaths);
		}
	}
}

// biome-ignore lint/suspicious/useAwait: <explanation>
export async function* createFileItemsGenerator(params: Params): FileItems {
	const loadedPaths = new Set<AbsoluteFsPath>();

	yield* generateFileItems(params, loadedPaths);

	loadedPaths.clear();
}
