interface Params {
	items: string[];
	direction?: "vertical" | "horizontal";
	gap?: `${number}px`;
}

export function container({ items, direction = "vertical", gap = "10px" }: Params) {
	const preparedItems = items.filter(Boolean);

	if (preparedItems.length === 0) {
		return "";
	}

	return `
		<div class="container container--${direction}" style="gap: ${gap}">
			${preparedItems.join("")}
		</div>
	`;
}
