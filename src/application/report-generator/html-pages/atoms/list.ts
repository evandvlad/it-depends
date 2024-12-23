interface Params {
	items: string[];
}

export function list({ items }: Params) {
	if (items.length === 0) {
		return "";
	}

	return `<ul class="list">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}
