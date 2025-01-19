export type Color = "green" | "yellow" | "red" | "blue" | "transparent";

interface Params {
	title: string;
	content?: string;
	open?: boolean;
	color?: Color;
}

export function callout({ title, content, open, color = "transparent" }: Params) {
	const className = `callout callout--${color}`;

	if (!content) {
		return `
			<div class="${className} callout--empty">
				<div class="callout__title">${title}</div>
			</div>
		`;
	}

	return `
		<details class="${className}" ${open ? "open" : ""}>
			<summary class="callout__title">${title}</summary>
			<div class="callout__content">
				${content}
			</div>
		</details>
	`;
}
