import { createId } from "~/lib/id";

interface Item {
	label: string;
	content: string;
}

interface Params {
	items: Item[];
}

export function tabs({ items }: Params) {
	const id = createId();

	const tabs = items
		.filter(({ content }) => Boolean(content))
		.map(({ label, content }, index) => {
			const name = `tabs-${id}`;
			const tabId = `tabs-tab-${id}-${index}`;

			return `
				<input class="tabs__tab-handle" type="radio" id="${tabId}" name="${name}" ${index === 0 ? "checked" : ""}>
				<label for="${tabId}" class="tabs__tab-label">${label}</label>
				<div class="tabs__tab-content">${content}</div>
			`;
		});

	if (tabs.length === 0) {
		return "";
	}

	return `
		<div class="tabs">
			${tabs.join("")}
		</div>
	`;
}
