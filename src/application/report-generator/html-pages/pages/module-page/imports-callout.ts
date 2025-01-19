import type { ModulePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { callout } from "../../atoms/callout";
import { counter } from "../../atoms/counter";
import { details } from "../../atoms/details";
import { item } from "../../atoms/item";

export function importsCallout(pageViewModel: ModulePageViewModel) {
	const items = pageViewModel.collectImportItems(({ name, linkData, values }) =>
		item({
			mainContent: details({
				title: linkData ? a(linkData) : name,
				content: values.join(", "),
			}),
			extraContent: counter({ value: values.length }),
		}),
	);

	return callout({
		title: `Imports ${counter({ value: pageViewModel.numOfImports, color: "white" })}`,
		content: items.join(""),
		color: "green",
	});
}
