import { createId } from "~/lib/id";
import { counter } from "../atoms/counter";
import { item } from "../atoms/item";
import { textbox } from "../atoms/textbox";
import { spreadDataAttrs } from "../helpers/data-attrs";

export interface Item {
	content: string;
	value: string;
	count?: number;
}

interface Params {
	items: Item[];
}

function getFilterConstructor({ itemsLength }: { itemsLength: number }) {
	if (itemsLength < 20) {
		return {
			listDataAttrs: {},
			getItemDataAttrs: () => ({}),
			renderFilterHtml: () => "",
		};
	}

	const id = createId();
	const switchModeId = `filtrable-list-switch-${id}`;

	return {
		listDataAttrs: { "data-js-filtrable-list": id },
		getItemDataAttrs: (value: string) => ({ "data-js-filtrable-list-item": id, "data-js-value": value }),
		renderFilterHtml: () => `
			<div class="entity-list__filter">
				${textbox({ placeholder: "Filter...", dataAttrs: { "data-js-filtrable-list-input": id } })}
				<input
					id="${switchModeId}"
					class="entity-list__mode-switch-checkbox"
					type="checkbox"
					data-js-filtrable-list-mode-switch="${id}"
				/>
				<label for="${switchModeId}" class="entity-list__mode-switch" title="Use Regular Expression">RE</label>
			</div>
		`,
	};
}

export function entityList({ items }: Params) {
	if (items.length === 0) {
		return "";
	}

	const filterContructor = getFilterConstructor({ itemsLength: items.length });

	const itemsContent = items
		.map(({ content, value, count }) =>
			item({
				mainContent: content,
				extraContent: typeof count !== "undefined" ? counter({ value: count }) : "",
				dataAttrs: filterContructor.getItemDataAttrs(value),
			}),
		)
		.join("");

	return `
		<div class="entity-list" ${spreadDataAttrs(filterContructor.listDataAttrs)}>
			${filterContructor.renderFilterHtml()}
			${itemsContent}
		</div>
	`;
}
