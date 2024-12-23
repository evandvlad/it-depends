interface Params {
	title: string;
	content?: string;
	open?: boolean;
}

export function details({ title, content, open }: Params) {
	if (!content) {
		return `
			<div class="details details--empty">
				${title}
			</div>
		`;
	}

	return `
		<details class="details" ${open ? "open" : ""}>
			<summary class="details__title">${title}</summary>
			<div class="details__content">${content}</div>
		</details>
	`;
}
