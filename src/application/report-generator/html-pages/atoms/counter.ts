interface Params {
	value: number;
	color?: "gray" | "white";
}

export function counter({ value, color = "gray" }: Params) {
	return `<span class="counter counter--${color}">${value}</span>`;
}
