import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";

export function shadowedExportValuesCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectShadowedExportValues(
		({ linkData, num }) => `${a(linkData)} ${counter({ value: num })}`,
	);

	return callout({
		title: `Shadowed export values ${counter({ value: pageViewModel.numOfShadowedExportValues })}`,
		content: list({ items }),
		color: pageViewModel.numOfShadowedExportValues > 0 ? "yellow" : "green",
	});
}
