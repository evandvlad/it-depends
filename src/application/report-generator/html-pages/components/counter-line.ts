import { counter } from "../atoms/counter";

interface Params {
	content: string;
	count: number;
}

export function counterLine({ content, count }: Params) {
	return `
		<div class="counter-line">
			<div>${content}</div>
			<div>${counter({ value: count })}</div>
		</div>
	`;
}
