interface Props {
	value: number;
}

export function counter({ value }: Props) {
	return `<span class="counter">${value}</span>`;
}
