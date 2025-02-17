interface Params {
	url: string;
	content: string;
	title?: string;
}

export function a({ content, url, title = "" }: Params) {
	return `<a class="link" href="${url}" title=${title}>${content}</a>`;
}
