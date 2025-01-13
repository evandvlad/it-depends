import type { ModulePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { counterLine } from "../components/counter-line";

export function importsCallout(pageViewModel: ModulePageViewModel) {
	const items = pageViewModel.collectImportItems(({ name, linkData, values }) => {
		const title = linkData ? a(linkData) : name;

		return counterLine({
			content: details({
				title,
				content: values.join(", "),
			}),
			count: values.length,
		});
	});

	return callout({
		title: `Imports ${counter({ value: pageViewModel.numOfImports, color: "white" })}`,
		content: items.join(""),
		color: "green",
	});
}
