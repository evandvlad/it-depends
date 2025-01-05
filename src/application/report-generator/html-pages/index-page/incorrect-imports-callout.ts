import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { list } from "../atoms/list";

export function incorrectImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectIncorrectImports(({ moduleLinkData, importItems }) =>
		details({
			title: `${a(moduleLinkData)} ${counter({ value: importItems.length })}`,
			content: list({ items: importItems.map(({ name, linkData }) => (linkData ? a(linkData) : name)) }),
		}),
	);

	return callout({
		title: `Incorrect imports ${counter({ value: pageViewModel.numOfIncorrectImports })}`,
		content: items.join(""),
		color: pageViewModel.numOfIncorrectImports > 0 ? "red" : "green",
	});
}
