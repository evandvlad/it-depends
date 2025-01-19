import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { details } from "../../atoms/details";
import { item } from "../../atoms/item";
import { countCallout } from "../../components/count-callout";

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

	return countCallout({
		title: "Out of scope imports",
		counter: { value: pageViewModel.numOfOutOfScopeImports },
		content: items.join(""),
		color: pageViewModel.numOfOutOfScopeImports > 0 ? "yellow" : "green",
	});
}
