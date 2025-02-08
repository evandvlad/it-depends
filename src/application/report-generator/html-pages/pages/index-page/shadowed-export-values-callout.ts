import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

export function shadowedExportValuesCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.shadowedExportValues.map(({ linkData, num }) => ({
		content: a(linkData),
		value: linkData.content,
		count: num,
	}));

	const count = pageViewModel.shadowedExportValues.reduce((acc, { num }) => acc + num, 0);

	return countCallout({
		title: "Shadowed export values",
		counter: { value: count },
		content: entityList({ items }),
		color: count > 0 ? "yellow" : "green",
	});
}
