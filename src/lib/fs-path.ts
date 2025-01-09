import { isAbsolute, join } from "node:path";

type ShortFsPath = string & { __brand: "short-fs-path" };

export type AbsoluteFsPath = string & { __brand: "absolute-fs-path" };

type FsPath = ShortFsPath | AbsoluteFsPath;

const delimiter = "/";

export function shortFsPath(path: string) {
	return path as ShortFsPath;
}

export function absoluteFsPath(path: string) {
	return path as AbsoluteFsPath;
}

export function normalizePath<T extends FsPath>(path: T) {
	return path.replaceAll("\\", delimiter).replace(/\/{2,}/g, delimiter) as T;
}

export function joinPaths(path: AbsoluteFsPath, subPath: string): AbsoluteFsPath {
	return normalizePath(join(path, subPath) as AbsoluteFsPath);
}

export function isAbsolutePath(path: string): path is AbsoluteFsPath {
	return isAbsolute(path);
}

export function getParentPath(path: AbsoluteFsPath): AbsoluteFsPath {
	return joinPaths(path, "..");
}

export function getName(path: FsPath) {
	return normalizePath(path).split(delimiter).at(-1)!;
}

export function getBreadcrumbs(path: AbsoluteFsPath) {
	const preparedPath = path.endsWith(delimiter) ? path.slice(0, -1) : path;
	const parts = preparedPath.split(delimiter);

	return parts.reduce<AbsoluteFsPath[]>((acc, part) => {
		if (acc.length === 0) {
			const rootPart = part === "" ? delimiter : part;
			acc.push(absoluteFsPath(rootPart));
			return acc;
		}

		const prevPath = acc.at(-1)!;
		const delim = prevPath === delimiter ? "" : delimiter;

		acc.push(absoluteFsPath(`${prevPath}${delim}${part}`));

		return acc;
	}, []);
}
