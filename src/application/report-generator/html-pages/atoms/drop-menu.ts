interface Item {
	content: string;
	onClick: string;
}

interface Params {
	items: Item[];
}

export function dropMenu({ items }: Params) {
	if (items.length === 0) {
		return "";
	}

	const itemsContent = items
		.map(({ content, onClick }) => `<div class="drop-menu__item" onclick="${onClick}">${content}</div>`)
		.join("");

	return `
		<div class="drop-menu">
			<span class="drop-menu__handle">...</span>
			<div class="drop-menu__items">
				${itemsContent}
			</div>
		</div>
	`;
}
