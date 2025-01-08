interface Params {
	title: string;
	content: string;
}

export function card({ title, content }: Params) {
	if (!content) {
		return "";
	}

	return `
		<div class="card">
			<div class="card__title">${title}</div>
			<div class="card__content">${content}</div>
		</div>
	`;
}
