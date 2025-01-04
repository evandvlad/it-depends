interface Params {
	items: string[];
}

export function list({ items }: Params) {
	if (items.length === 0) {
		return "";
	}

	return `<ul class="list">${items.map((item) => `<li class="list__item">${item}</li>`).join("")}</ul>`;
}
