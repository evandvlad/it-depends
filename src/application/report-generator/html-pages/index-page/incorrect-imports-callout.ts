import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { list } from "../atoms/list";
import { counterLine } from "../components/counter-line";

export function incorrectImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectIncorrectImports(({ linkData, importItems }) =>
		counterLine({
			content: details({
				title: a(linkData),
				content: list({ items: importItems.map(({ name, linkData }) => (linkData ? a(linkData) : name)) }),
			}),
			count: importItems.length,
		}),
	);

	return callout({
		title: `Incorrect imports ${counter({ value: pageViewModel.numOfIncorrectImports, color: "white" })}`,
		content: items.join(""),
		color: pageViewModel.numOfIncorrectImports > 0 ? "red" : "green",
	});
}
