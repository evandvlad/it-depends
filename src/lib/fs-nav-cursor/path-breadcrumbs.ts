import { type AbsoluteFsPath, absoluteFsPath, delimiter } from "../fs-path";

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
