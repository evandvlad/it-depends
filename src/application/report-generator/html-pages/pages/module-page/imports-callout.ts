import type { ModulePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { details } from "../../atoms/details";
import { item } from "../../atoms/item";
import { countCallout } from "../../components/count-callout";

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

	return countCallout({
		title: "Imports",
		counter: { value: pageViewModel.numOfImports },
		content: items.join(""),
		color: "green",
	});
}
