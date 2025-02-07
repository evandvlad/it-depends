export function isRelative(path: string) {
	return path === "." || path === ".." || path.startsWith("./") || path.startsWith("../");
}
