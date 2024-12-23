interface Params {
	content: string;
}

export function headerHeading({ content }: Params) {
	return `<div class="header-heading">${content}</div>`;
}
