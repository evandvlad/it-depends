import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";

export function possiblyUnusedExportValuesCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectPossiblyUnusedExportValues(({ linkData, values }) =>
		details({
			title: `${a(linkData)} ${counter({ value: values.length })}`,
			content: values.join(", "),
		}),
	);

	return callout({
		title: `Possibly unused export values ${counter({
			value: pageViewModel.numOfPossiblyUnusedExportValues,
			color: "white",
		})}`,
		content: items.join(""),
		color: pageViewModel.numOfPossiblyUnusedExportValues > 0 ? "yellow" : "green",
	});
}
