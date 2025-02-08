import type { ModulePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { details } from "../../atoms/details";
import { list } from "../../atoms/list";
import { tabs } from "../../atoms/tabs";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

export function exportsCallout(pageViewModel: ModulePageViewModel) {
	const itemsByModules = pageViewModel.exportsByModules.map(({ linkData, values }) => ({
		content: details({
			title: a(linkData),
			content: values.join(", "),
		}),
		value: linkData.content,
		count: values.length,
	}));

	const itemsByValues = pageViewModel.exportsByValues.map(({ value, linksData }) => ({
		value,
		content: details({
			title: value,
			content: list({ items: linksData.map((linkData) => ({ content: a(linkData) })) }),
		}),
		count: linksData.length,
	}));

	const count = pageViewModel.exportsByModules.reduce((acc, { values }) => acc + values.length, 0);

	return countCallout({
		title: "Exports",
		counter: { value: count },
		content: tabs({
			items: [
				{ label: "By modules", content: entityList({ type: "module", items: itemsByModules }) },
				{ label: "By values", content: entityList({ type: "module", items: itemsByValues }) },
			],
		}),
		color: count > 0 ? "green" : "yellow",
	});
}
