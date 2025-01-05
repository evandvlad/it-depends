import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";

export function outOfScopeImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectOutOfScopeImports(({ linkData, values }) =>
		details({
			title: `${a(linkData)} ${counter({ value: values.length })}`,
			content: values.join(", "),
		}),
	);

	return callout({
		title: `Out of scope imports ${counter({ value: pageViewModel.numOfOutOfScopeImports })}`,
		content: items.join(""),
		color: pageViewModel.numOfOutOfScopeImports > 0 ? "yellow" : "green",
	});
}
