interface Props {
	value: number;
	color?: "gray" | "white";
}

export function counter({ value, color = "gray" }: Props) {
	return `<span class="counter counter--${color}">${value}</span>`;
}
