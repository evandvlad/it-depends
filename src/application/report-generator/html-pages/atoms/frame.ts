interface Params {
	content: string;
	color?: "green" | "yellow" | "red";
}

export function frame({ content, color = "green" }: Params) {
	return `<div class="frame frame--${color}">${content}</div>`;
}
