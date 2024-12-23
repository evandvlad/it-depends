interface Params {
	items: TreeItem[];
}

export interface TreeItem {
	content: string;
	children: TreeItem[];
	open?: boolean;
}

export function tree({ items }: Params): string {
	if (items.length === 0) {
		return "";
	}

	const content = items
		.map(({ content, children, open }) => {
			if (children.length === 0) {
				return `<div class="tree__item">${content}</div>`;
			}

			return `
				<details class="tree__subtree" ${open ? "open" : ""}>
					<summary class="tree__subtree-item">${content}</summary>
					${tree({ items: children })}
				</details>
			`;
		})
		.join("");

	return `
		<div class="tree">
			${content}
		</div>
	`;
}
