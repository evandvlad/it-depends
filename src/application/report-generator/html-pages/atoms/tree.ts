interface Params {
	items: TreeItem[];
}

interface TreeItem {
	content: string;
	children: TreeItem[];
	title: string;
	open?: boolean;
}

export function tree({ items }: Params): string {
	if (items.length === 0) {
		return "";
	}

	const content = items
		.map(({ content, children, title, open = false }) => {
			if (children.length === 0) {
				return `
					<div class="tree__item">
						<span title="${title}">
							${content}
						</span>
					</div>
				`;
			}

			return `
				<details class="tree__subtree" ${open ? "open" : ""}>
					<summary class="tree__subtree-item">
						<span title="${title}">${content}</span>
					</summary>
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
