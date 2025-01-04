interface Params {
	items: string[];
	direction?: "vertical" | "horizontal";
	gap?: `${number}px`;
}

export function container({ items, direction = "vertical", gap = "10px" }: Params) {
	return `
		<div class="container container--${direction}" style="gap: ${gap}">
			${items.join("")}
		</div>
	`;
}
