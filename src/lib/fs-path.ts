import { isAbsolute, join } from "node:path";

type ShortFsPath = string & { __brand: "short-fs-path" };

export type AbsoluteFsPath = string & { __brand: "absolute-fs-path" };

type FsPath = ShortFsPath | AbsoluteFsPath;

export const delimiter = "/";

function splitPath<T extends FsPath>(path: T) {
	const parts = path.split(delimiter);

	if (!parts[0]) {
		parts[0] = delimiter;
	}

	return parts.filter(Boolean);
}

export function shortFsPath(path: string) {
	return path as ShortFsPath;
}

export function absoluteFsPath(path: string) {
	return path as AbsoluteFsPath;
}

export function normalizePath<T extends FsPath>(path: T) {
	const escapedPath = path.replaceAll("\\", delimiter).replace(/\/{2,}/g, delimiter);

	if (escapedPath === delimiter || !escapedPath.endsWith(delimiter)) {
		return escapedPath as T;
	}

	return escapedPath.slice(0, -1) as T;
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
	return splitPath(path).at(-1)!;
}

export function getBreadcrumbs(path: AbsoluteFsPath) {
	return splitPath(path).reduce<AbsoluteFsPath[]>((acc, part) => {
		if (acc.length === 0) {
			acc.push(absoluteFsPath(part));
			return acc;
		}

		acc.push(joinPaths(acc.at(-1)!, part));

		return acc;
	}, []);
}
