import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { details } from "../../atoms/details";
import { item } from "../../atoms/item";
import { tabs } from "../../atoms/tabs";
import { countCallout } from "../../components/count-callout";

export function possiblyUnusedExportsCallout(pageViewModel: IndexPageViewModel) {
	const fullyUnusedItems: string[] = [];
	const partiallyUnusedItems: string[] = [];
	const count = pageViewModel.possiblyUnusedExports.reduce((acc, { values }) => acc + values.length, 0);

	pageViewModel.possiblyUnusedExports.forEach(({ linkData, values, isFullyUnused }) => {
		const content = item({
			mainContent: details({
				title: a(linkData),
				content: values.join(", "),
			}),
			extraContent: counter({ value: values.length }),
		});

		if (isFullyUnused) {
			fullyUnusedItems.push(content);
		} else {
			partiallyUnusedItems.push(content);
		}
	});

	return countCallout({
		title: "Possibly unused exports",
		counter: { value: count },
		content: tabs({
			items: [
				{ label: "Fully possible unused", content: fullyUnusedItems.join("") },
				{ label: "Partially possible unused", content: partiallyUnusedItems.join("") },
			],
		}),
		color: count > 0 ? "yellow" : "green",
	});
}
