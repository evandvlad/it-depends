import type { ModulePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";

export function importsCallout(pageViewModel: ModulePageViewModel) {
	const items = pageViewModel.collectImportItems(({ name, moduleLink, values }) => {
		const label = moduleLink ? a(moduleLink) : name;

		return details({
			title: `${label} ${counter({ value: values.length })}`,
			content: values.join(", "),
		});
	});

	return callout({
		title: `Imports ${counter({ value: pageViewModel.numOfImports, color: "white" })}`,
		content: items.join(""),
		color: "green",
		open: true,
	});
}
