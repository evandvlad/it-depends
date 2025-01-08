import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { card } from "../atoms/card";
import { container } from "../atoms/container";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";

function getCalloutContent(pageViewModel: IndexPageViewModel) {
	const importItems = pageViewModel.collectUnresolvedFullImports(
		({ linkData, num }) => `${a(linkData)} ${counter({ value: num })}`,
	);

	const exportItems = pageViewModel.collectUnresolvedFullExports(
		({ linkData, num }) => `${a(linkData)} ${counter({ value: num })}`,
	);

	return container({
		items: [
			card({ title: "Imports", content: list({ items: importItems }) }),
			card({ title: "Exports", content: list({ items: exportItems }) }),
		],
		gap: "0px",
	});
}

export function unresolvedFullIECallout(pageViewModel: IndexPageViewModel) {
	const count = pageViewModel.numOfUnresolvedFullIE;

	return callout({
		title: `Unresolved full imports/exports ${counter({ value: count, color: "white" })}`,
		color: count > 0 ? "yellow" : "green",
		content: count > 0 ? getCalloutContent(pageViewModel) : "",
	});
}
