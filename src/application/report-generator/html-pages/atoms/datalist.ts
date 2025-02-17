interface Item {
	label: string;
	value: string;
	title?: string;
}

interface Params {
	items: Item[];
}

function datalistItem({ label, value, title = "" }: Item) {
	return `
		<div class="datalist__item">
			<div class="datalist__item-label">${label}</div>
			<div class="datalist__item-value" title=${title}>${value || " - "}</div>
		</div>
	`;
}

export function datalist({ items }: Params) {
	if (items.length === 0) {
		return "";
	}

	return `
		<div class="datalist">
			${items.map((item) => datalistItem(item)).join("")}
		</div>
	`;
}
