interface Item {
	content: string;
}

interface Params {
	items: Item[];
	direction?: "vertical" | "horizontal";
	gap?: `${number}px`;
}

export function container({ items, direction = "vertical", gap = "10px" }: Params) {
	const preparedItems = items.filter(({ content }) => Boolean(content));

	if (preparedItems.length === 0) {
		return "";
	}

	return `
		<div class="container container--${direction}" style="gap: ${gap}">
			${preparedItems.map(({ content }) => content).join("")}
		</div>
	`;
}
