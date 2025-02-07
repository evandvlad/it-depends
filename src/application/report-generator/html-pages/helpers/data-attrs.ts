export type DataAttrs = Record<`data-${string}`, string>;

export function spreadDataAttrs(dataAttrs?: DataAttrs) {
	if (!dataAttrs) {
		return "";
	}

	return Object.entries(dataAttrs)
		.map(([name, value]) => `${name}="${value}"`)
		.join(" ");
}
