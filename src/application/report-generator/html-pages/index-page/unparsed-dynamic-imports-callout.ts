import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";

export function unparsedDynamicImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectUnparsedDynamicImports(
		({ linkData, num }) => `${a(linkData)} ${counter({ value: num })}`,
	);

	return callout({
		title: `Unparsed dynamic imports ${counter({ value: pageViewModel.numOfUnparsedDynamicImports, color: "white" })}`,
		content: list({ items }),
		color: pageViewModel.numOfUnparsedDynamicImports > 0 ? "yellow" : "green",
	});
}
