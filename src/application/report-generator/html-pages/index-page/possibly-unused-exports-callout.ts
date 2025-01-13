import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { tabs } from "../atoms/tabs";
import { counterLine } from "../components/counter-line";

export function possiblyUnusedExportsCallout(pageViewModel: IndexPageViewModel) {
	const fullyUnusedItems: string[] = [];
	const partiallyUnusedItems: string[] = [];

	pageViewModel.collectPossiblyUnusedExports(({ linkData, values, isFullyUnused }) => {
		const content = counterLine({
			content: details({
				title: a(linkData),
				content: values.join(", "),
			}),
			count: values.length,
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
