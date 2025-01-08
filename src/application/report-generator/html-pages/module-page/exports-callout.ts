import type { ModulePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { list } from "../atoms/list";
import { tabs } from "../atoms/tabs";

export function exportsCallout(pageViewModel: ModulePageViewModel) {
	const itemsByModules = pageViewModel.collectExportItemsByModules(({ linkData, values }) =>
		details({
			title: `${a(linkData)} ${counter({ value: values.length })}`,
			content: values.join(", "),
		}),
	);

	const itemsByValues = pageViewModel.collectExportItemsByValues(({ value, linksData }) =>
		details({
			title: `${value} ${counter({ value: linksData.length })}`,
			content: list({ items: linksData.map((linkData) => a(linkData)) }),
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
