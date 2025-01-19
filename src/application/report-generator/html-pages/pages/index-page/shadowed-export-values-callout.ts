import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

export function shadowedExportValuesCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectShadowedExportValues(({ linkData, num }) => ({
		content: item({ mainContent: a(linkData), extraContent: counter({ value: num }) }),
	}));

	return countCallout({
		title: "Shadowed export values",
		counter: { value: pageViewModel.numOfShadowedExportValues },
		content: list({ items }),
		color: pageViewModel.numOfShadowedExportValues > 0 ? "yellow" : "green",
	});
}
