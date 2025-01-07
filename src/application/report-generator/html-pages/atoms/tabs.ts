interface Params {
	items: { label: string; content: string }[];
}

let indexId = 0;

export function tabs({ items }: Params) {
	indexId += 1;

	const tabs = items
		.filter(({ content }) => Boolean(content))
		.map(({ label, content }, index) => {
			const name = `tabs-${indexId}`;
			const id = `tabs-tab-${indexId}-${index}`;

			return `
				<input class="tabs__tab-handle" type="radio" id="${id}" name="${name}" ${index === 0 ? "checked" : ""}>
				<label for="${id}" class="tabs__tab-label">${label}</label>
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
