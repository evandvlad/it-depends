import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { item } from "../atoms/item";
import { list } from "../atoms/list";

export function incorrectImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectIncorrectImports(({ linkData, importItems }) =>
		item({
			mainContent: details({
				title: a(linkData),
				content: list({
					items: importItems.map(({ name, linkData }) => ({ content: linkData ? a(linkData) : name })),
				}),
			}),
			extraContent: counter({ value: importItems.length }),
		}),
	);

	return callout({
		title: `Incorrect imports ${counter({ value: pageViewModel.numOfIncorrectImports, color: "white" })}`,
		content: items.join(""),
		color: pageViewModel.numOfIncorrectImports > 0 ? "red" : "green",
	});
}
