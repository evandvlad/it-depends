import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { callout } from "../../atoms/callout";
import { counter } from "../../atoms/counter";
import { details } from "../../atoms/details";
import { item } from "../../atoms/item";
import { tabs } from "../../atoms/tabs";

export function possiblyUnusedExportsCallout(pageViewModel: IndexPageViewModel) {
	const fullyUnusedItems: string[] = [];
	const partiallyUnusedItems: string[] = [];

	pageViewModel.collectPossiblyUnusedExports(({ linkData, values, isFullyUnused }) => {
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

	return callout({
		title: `Possibly unused exports ${counter({
			value: pageViewModel.numOfPossiblyUnusedExports,
			color: "white",
		})}`,
		content: tabs({
			items: [
				{ label: "Fully possible unused", content: fullyUnusedItems.join("") },
				{ label: "Partially possible unused", content: partiallyUnusedItems.join("") },
			],
		}),
		color: pageViewModel.numOfPossiblyUnusedExports > 0 ? "yellow" : "green",
	});
}
