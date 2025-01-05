import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";

export function unresolvedFullExportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectUnresolvedFullExports(
		({ linkData, num }) => `${a(linkData)} ${counter({ value: num })}`,
	);

	return callout({
		title: `Unresolved full exports ${counter({ value: pageViewModel.numOfUnresolvedFullExports })}`,
		content: list({ items }),
		color: pageViewModel.numOfUnresolvedFullExports > 0 ? "yellow" : "green",
	});
}
