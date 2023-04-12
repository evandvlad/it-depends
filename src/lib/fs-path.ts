import libPath from "node:path";

import { FSPath } from "../values";

export function normalizePath(path: FSPath) {
	return path.replaceAll("\\", "/").replace(/\/{2,}/g, "/");
}

export function joinPaths(subPath1: FSPath, subPath2: FSPath) {
	return normalizePath(libPath.join(subPath1, subPath2));
}

export function isAbsolutePath(path: FSPath) {
	return libPath.isAbsolute(path);
}

export function getPathBreadcrumbs(path: FSPath): FSPath[] {
	const preparedPath = path.endsWith("/") ? path.slice(0, -1) : path;
	const parts = preparedPath.split("/");

	return parts.reduce<FSPath[]>((acc, part) => {
		if (acc.length === 0) {
			acc.push(part);
			return acc;
		}

		const prevPath = acc.at(-1)!;

		acc.push([prevPath, part].join("/"));

		return acc;
	}, []);
}
