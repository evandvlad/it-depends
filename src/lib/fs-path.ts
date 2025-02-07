import { assert } from "~/lib/errors";

export const delimiter = "/";

function splitPath(path: string) {
	const parts = path.split(delimiter);

	if (!parts[0]) {
		parts[0] = delimiter;
	}

	return parts.filter(Boolean);
}

function isRoot(path: string) {
	return path === delimiter || !path.includes(delimiter);
}

export function normalizePath(path: string) {
	const escapedPath = path.replaceAll("\\", delimiter).replace(/\/{2,}/g, delimiter);

	if (escapedPath === delimiter || !escapedPath.endsWith(delimiter)) {
		return escapedPath;
	}

	return escapedPath.slice(0, -1);
}

export function joinPaths(path: string, subPath: string) {
	const parts = subPath.split(delimiter);

	const [firstPart, ...otherParts] = parts;

	if (firstPart === "..") {
		assert(Boolean(path && !isRoot(path)), `Can't join path '${path || delimiter}' with sub-path '${subPath}'`);

		const parentPath = path.split(delimiter).slice(0, -1).join(delimiter);
		return joinPaths(parentPath, otherParts.join(delimiter));
	}

	if (firstPart === ".") {
		return normalizePath(`${path}${delimiter}${otherParts.join(delimiter)}`);
	}

	return normalizePath(`${path}${delimiter}${subPath}`);
}

export function getParentPath(path: string) {
	assert(!isRoot(path), `Can't get parent path from root '${path}'`);
	return joinPaths(path, "..");
}

export function getName(path: string) {
	return splitPath(path).at(-1)!;
}

export function getBreadcrumbs(path: string) {
	return splitPath(path).reduce<string[]>((acc, part) => {
		if (acc.length === 0) {
			acc.push(part);
			return acc;
		}

		acc.push(joinPaths(acc.at(-1)!, part));

		return acc;
	}, []);
}
