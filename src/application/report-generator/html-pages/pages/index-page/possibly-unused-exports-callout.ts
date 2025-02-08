import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { details } from "../../atoms/details";
import { tabs } from "../../atoms/tabs";
import { countCallout } from "../../components/count-callout";
import { type Item, entityList } from "../../components/entity-list";

export function possiblyUnusedExportsCallout(pageViewModel: IndexPageViewModel) {
	const fullyUnusedItems: Item[] = [];
	const partiallyUnusedItems: Item[] = [];
	const count = pageViewModel.possiblyUnusedExports.reduce((acc, { values }) => acc + values.length, 0);

	pageViewModel.possiblyUnusedExports.forEach(({ linkData, values, isFullyUnused }) => {
		const item = {
			content: details({
				title: a(linkData),
				content: values.join(", "),
			}),
			value: linkData.content,
			count: values.length,
		};

		if (isFullyUnused) {
			fullyUnusedItems.push(item);
		} else {
			partiallyUnusedItems.push(item);
		}
	});

	return countCallout({
		title: "Possibly unused exports",
		counter: { value: count },
		content: tabs({
			items: [
				{ label: "Fully possible unused", content: entityList({ type: "module", items: fullyUnusedItems }) },
				{ label: "Partially possible unused", content: entityList({ type: "module", items: partiallyUnusedItems }) },
			],
		}),
		color: count > 0 ? "yellow" : "green",
	});
}
