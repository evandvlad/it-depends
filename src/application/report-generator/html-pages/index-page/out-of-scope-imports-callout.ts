import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { counterLine } from "../components/counter-line";

export function outOfScopeImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectOutOfScopeImports(({ linkData, values }) =>
		counterLine({
			content: details({
				title: a(linkData),
				content: values.join(", "),
			}),
			count: values.length,
		}),
	);

	return callout({
		title: `Out of scope imports ${counter({ value: pageViewModel.numOfOutOfScopeImports, color: "white" })}`,
		content: items.join(""),
		color: pageViewModel.numOfOutOfScopeImports > 0 ? "yellow" : "green",
	});
}
