import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

export function shadowedExportValuesCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.shadowedExportValues.map(({ linkData, num }) => ({
		content: item({ mainContent: a(linkData), extraContent: counter({ value: num }) }),
	}));

	const count = pageViewModel.shadowedExportValues.reduce((acc, { num }) => acc + num, 0);

	return countCallout({
		title: "Shadowed export values",
		counter: { value: count },
		content: list({ items }),
		color: count > 0 ? "yellow" : "green",
	});
}
