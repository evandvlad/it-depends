import { createId } from "~/lib/id";
import { textbox } from "../atoms/textbox";

interface Item {
	content: string;
	value: string;
}

interface Params {
	inputPlaceholder: string;
	items: Item[];
}

export function filterableList({ inputPlaceholder, items }: Params) {
	if (items.length === 0) {
		return "";
	}

	const id = createId();
	const switchModeId = `filtrable-list-switch-${id}`;

	const itemsContent = items
		.map((item) => `<div data-js-filtrable-list-item="${id}" data-js-value="${item.value}">${item.content}</div>`)
		.join("");

	return `
		<div class="filtrable-list" data-js-filtrable-list="${id}">
			<div class="filtrable-list__filter">
				${textbox({ placeholder: inputPlaceholder, dataAttrs: { "data-js-filtrable-list-input": id } })}
				<input
					id="${switchModeId}"
					class="filtrable-list__mode-switch-checkbox"
					type="checkbox"
					data-js-filtrable-list-mode-switch="${id}"
				/>
				<label for="${switchModeId}" class="filtrable-list__mode-switch" title="Use Regular Expression">RE</label>
			</div>
			${itemsContent}
		</div>
	`;
}
