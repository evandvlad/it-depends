export const delimiter = "/";

function splitPath(path: string) {
	const parts = path.split(delimiter);

	if (!parts[0]) {
		parts[0] = delimiter;
	}

	return parts.filter(Boolean);
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

	if (parts.length === 0) {
		return path;
	}

	const [firstPart, ...otherParts] = parts;

	if (firstPart === "..") {
		const parentPath = path.split(delimiter).slice(0, -1).join(delimiter);
		return joinPaths(parentPath, otherParts.join(delimiter));
	}

	if (firstPart === ".") {
		return normalizePath(`${path}${delimiter}${otherParts.join(delimiter)}`);
	}

	return normalizePath(`${path}${delimiter}${subPath}`);
}

export function getParentPath(path: string) {
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
