interface Params {
	url: string;
	content: string;
}

export function a({ content, url }: Params) {
	return `<a class="link" href="${url}">${content}</a>`;
}
