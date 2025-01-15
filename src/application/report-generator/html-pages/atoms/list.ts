import { type DataAttrs, spreadDataAttrs } from "../helpers/data-attrs";

interface Item {
	content: string;
	dataAttrs?: DataAttrs;
}

interface Params {
	items: Item[];
	dataAttrs?: DataAttrs;
}

export function list({ items, dataAttrs }: Params) {
	if (items.length === 0) {
		return "";
	}

	return `
		<ul class="list" ${spreadDataAttrs(dataAttrs)}>
			${items.map((item) => `<li class="list__item" ${spreadDataAttrs(item.dataAttrs)}>${item.content}</li>`).join("")}
		</ul>
	`;
}
