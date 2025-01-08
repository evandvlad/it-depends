interface Params {
	content: string;
	color?: "green" | "yellow" | "red";
}

export function frame({ content, color = "green" }: Params) {
	if (!content) {
		return "";
	}

	return `<div class="frame frame--${color}">${content}</div>`;
}
