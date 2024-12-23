import { readdir } from "node:fs/promises";
import { type AbsoluteFsPath, getParentPath, joinPaths } from "../../lib/fs-path";
import { type Conf, confFileName } from "./values";

async function findConfPath(path: AbsoluteFsPath): Promise<AbsoluteFsPath> {
	const items = await readdir(path);
	return items.includes(confFileName) ? joinPaths(path, confFileName) : await findConfPath(getParentPath(path));
}

export async function loadConf(): Promise<Conf> {
	const confPath = await findConfPath(__dirname as AbsoluteFsPath);

	const importModule = await import(confPath);
	return (importModule as { default: Conf }).default;
}
