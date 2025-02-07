import { type Color, callout } from "../atoms/callout";
import { type Params as CounterParams, counter as counterAtom } from "../atoms/counter";

interface Params {
	title: string;
	counter: CounterParams;
	content?: string;
	open?: boolean;
	color?: Color;
}

export function countCallout({ title, counter, content = "", open = false, color = "green" }: Params) {
	const calloutTitle = counter ? `${title} ${counterAtom({ color: "white", ...counter })}` : title;

	return callout({
		content,
		open,
		color,
		title: calloutTitle,
	});
}
