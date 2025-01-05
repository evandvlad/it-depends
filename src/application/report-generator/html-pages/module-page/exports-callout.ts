import type { ModulePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { list } from "../atoms/list";

export function exportsCallout(pageViewModel: ModulePageViewModel) {
	const items = pageViewModel.collectExportItems(({ value, moduleLinks }) =>
		details({
			title: `${value} ${counter({ value: moduleLinks.length })}`,
			content: list({ items: moduleLinks.map((linkData) => a(linkData)) }),
		}),
	);

	return callout({
		title: `Exports ${counter({ value: pageViewModel.numOfExports })}`,
		content: items.join(""),
		color: "green",
		open: true,
	});
}
