import type { ModulePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { details } from "../../atoms/details";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";
import { tabs } from "../../atoms/tabs";
import { countCallout } from "../../components/count-callout";

export function exportsCallout(pageViewModel: ModulePageViewModel) {
	const itemsByModules = pageViewModel.exportsByModules.map(({ linkData, values }) =>
		item({
			mainContent: details({
				title: a(linkData),
				content: values.join(", "),
			}),
			extraContent: counter({ value: values.length }),
		}),
	);

	const itemsByValues = pageViewModel.exportsByValues.map(({ value, linksData }) =>
		item({
			mainContent: details({
				title: value,
				content: list({ items: linksData.map((linkData) => ({ content: a(linkData) })) }),
			}),
			extraContent: counter({ value: linksData.length }),
		}),
	);

	const count = pageViewModel.exportsByModules.reduce((acc, { values }) => acc + values.length, 0);

	return countCallout({
		title: "Exports",
		counter: { value: count },
		content: tabs({
			items: [
				{ label: "By modules", content: itemsByModules.join("") },
				{ label: "By values", content: itemsByValues.join("") },
			],
		}),
		color: count > 0 ? "green" : "yellow",
	});
}
