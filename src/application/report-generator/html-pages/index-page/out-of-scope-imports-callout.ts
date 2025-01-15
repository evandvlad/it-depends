import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { item } from "../atoms/item";

export function outOfScopeImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectOutOfScopeImports(({ linkData, values }) =>
		item({
			mainContent: details({
				title: a(linkData),
				content: values.join(", "),
			}),
			extraContent: counter({ value: values.length }),
		}),
	);

	return callout({
		title: `Out of scope imports ${counter({ value: pageViewModel.numOfOutOfScopeImports, color: "white" })}`,
		content: items.join(""),
		color: pageViewModel.numOfOutOfScopeImports > 0 ? "yellow" : "green",
	});
}
