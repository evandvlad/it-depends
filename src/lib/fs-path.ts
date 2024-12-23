import { isAbsolute, join } from "node:path";

type ShortFsPath = string & { __brand: "short-fs-path" };

export type AbsoluteFsPath = string & { __brand: "absolute-fs-path" };

type FsPath = ShortFsPath | AbsoluteFsPath;

export const delimiter = "/";

export function shortFsPath(path: string) {
	return path as ShortFsPath;
}

export function absoluteFsPath(path: string) {
	return path as AbsoluteFsPath;
}

export function normalizePath<T extends FsPath>(path: T) {
	return path.replaceAll("\\", delimiter).replace(/\/{2,}/g, delimiter) as T;
}

export function joinPaths<T extends FsPath>(subPath1: T, subPath2: string) {
	return normalizePath(join(subPath1, subPath2) as T);
}

export function isAbsolutePath(path: string): path is AbsoluteFsPath {
	return isAbsolute(path);
}

export function getParentPath<T extends FsPath>(path: T): T {
	return joinPaths(path, "..");
}

export function getName(path: FsPath) {
	return normalizePath(path).split(delimiter).at(-1)!;
}
