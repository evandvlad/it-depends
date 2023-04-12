import fs from "node:fs/promises";

import { joinPaths } from "./lib/fs-path";
import { isAcceptableFile } from "./lib/module-details";
import { PathFilter, FSPath, ModuleFile } from "./values";

interface Options {
	paths: FSPath[];
	filter: PathFilter;
}

async function* load(paths: FSPath[], filter: PathFilter, loadedPaths: Set<FSPath>): AsyncGenerator<ModuleFile> {
	for (const path of paths) {
		if (loadedPaths.has(path)) {
			continue;
		}

		loadedPaths.add(path);

		const stat = await fs.stat(path);

		if (stat.isFile()) {
			if (!isAcceptableFile(path) || !filter(path)) {
				continue;
			}

			const code = await fs.readFile(path, "utf-8");
			yield { path, code };
		}

		if (stat.isDirectory()) {
			const names = await fs.readdir(path);
			const subPaths = names.map((name) => joinPaths(path, name));

			yield* load(subPaths, filter, loadedPaths);
		}
	}
}

export async function* loadFiles({ paths, filter }: Options): AsyncGenerator<ModuleFile> {
	const loadedPaths = new Set<FSPath>();

	yield* load(paths, filter, loadedPaths);

	loadedPaths.clear();
}
