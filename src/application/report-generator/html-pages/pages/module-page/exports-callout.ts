import type { ModulePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { details } from "../../atoms/details";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";
import { tabs } from "../../atoms/tabs";
import { countCallout } from "../../components/count-callout";

export function exportsCallout(pageViewModel: ModulePageViewModel) {
	const itemsByModules = pageViewModel.collectExportItemsByModules(({ linkData, values }) =>
		item({
			mainContent: details({
				title: a(linkData),
				content: values.join(", "),
			}),
			extraContent: counter({ value: values.length }),
		}),
	);

	const itemsByValues = pageViewModel.collectExportItemsByValues(({ value, linksData }) =>
		item({
			mainContent: details({
				title: value,
				content: list({ items: linksData.map((linkData) => ({ content: a(linkData) })) }),
			}),
			extraContent: counter({ value: linksData.length }),
		}),
	);

	return countCallout({
		title: "Exports",
		counter: { value: pageViewModel.numOfExports },
		content: tabs({
			items: [
				{ label: "By modules", content: itemsByModules.join("") },
				{ label: "By values", content: itemsByValues.join("") },
			],
		}),
		color: pageViewModel.numOfExports > 0 ? "green" : "yellow",
	});
}
