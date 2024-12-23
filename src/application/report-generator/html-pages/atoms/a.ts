interface Params {
	text: string;
	href: string;
}

export function a({ text, href }: Params) {
	return `<a class="link" href="${href}">${text}</a>`;
}
