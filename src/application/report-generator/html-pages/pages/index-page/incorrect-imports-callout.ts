import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { details } from "../../atoms/details";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

export function incorrectImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.incorrectImports.map(({ linkData, importItems }) =>
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

	const count = pageViewModel.incorrectImports.reduce((acc, { importItems }) => acc + importItems.length, 0);

	return countCallout({
		title: "Incorrect imports",
		counter: { value: count },
		content: items.join(""),
		color: count > 0 ? "red" : "green",
	});
}
