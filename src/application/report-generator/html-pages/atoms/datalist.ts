interface Item {
	label: string;
	value: string;
}

interface Params {
	items: Item[];
	borderColor?: "white" | "gray";
}

function datalistItem({ label, value }: Item) {
	return `
		<div class="datalist__item">
			<div class="datalist__item-label">${label}</div>
			<div class="datalist__item-value">${value || " - "}</div>
		</div>
	`;
}

export function datalist({ items, borderColor = "gray" }: Params) {
	return `
		<div class="datalist datalist--border-${borderColor}">
			${items.map((item) => datalistItem(item)).join("")}
		</div>
	`;
}
