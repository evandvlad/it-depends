import type { ModulePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { list } from "../atoms/list";
import { tabs } from "../atoms/tabs";
import { counterLine } from "../components/counter-line";

export function exportsCallout(pageViewModel: ModulePageViewModel) {
	const itemsByModules = pageViewModel.collectExportItemsByModules(({ linkData, values }) =>
		counterLine({
			content: details({
				title: a(linkData),
				content: values.join(", "),
			}),
			count: values.length,
		}),
	);

	const itemsByValues = pageViewModel.collectExportItemsByValues(({ value, linksData }) =>
		counterLine({
			content: details({
				title: value,
				content: list({ items: linksData.map((linkData) => a(linkData)) }),
			}),
			count: linksData.length,
		}),
	);

	return callout({
		title: `Exports ${counter({ value: pageViewModel.numOfExports, color: "white" })}`,
		content: tabs({
			items: [
				{ label: "By modules", content: itemsByModules.join("") },
				{ label: "By values", content: itemsByValues.join("") },
			],
		}),
		color: pageViewModel.numOfExports > 0 ? "green" : "yellow",
	});
}
