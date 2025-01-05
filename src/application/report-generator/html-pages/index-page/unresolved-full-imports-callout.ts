import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";

export function unresolvedFullImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectUnresolvedFullImports(
		({ linkData, num }) => `${a(linkData)} ${counter({ value: num })}`,
	);

	return callout({
		title: `Unresolved full imports ${counter({ value: pageViewModel.numOfUnresolvedFullImports })}`,
		content: list({ items }),
		color: pageViewModel.numOfUnresolvedFullImports > 0 ? "yellow" : "green",
	});
}
