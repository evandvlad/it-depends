import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { container } from "../atoms/container";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { list } from "../atoms/list";

function getCalloutContent(pageViewModel: IndexPageViewModel) {
	const containerItems: string[] = [];

	const importItems = pageViewModel.collectUnresolvedFullImports(
		({ linkData, num }) => `${a(linkData)} ${counter({ value: num })}`,
	);

	const exportItems = pageViewModel.collectUnresolvedFullExports(
		({ linkData, num }) => `${a(linkData)} ${counter({ value: num })}`,
	);

	if (importItems.length > 0) {
		containerItems.push(details({ title: "Imports", content: list({ items: importItems }), open: true }));
	}

	if (exportItems.length > 0) {
		containerItems.push(details({ title: "Exports", content: list({ items: exportItems }), open: true }));
	}

	return container({ items: containerItems });
}

export function unresolvedFullIECallout(pageViewModel: IndexPageViewModel) {
	const count = pageViewModel.numOfUnresolvedFullIE;

	return callout({
		title: `Unresolved full imports/exports ${counter({ value: count })}`,
		color: count > 0 ? "yellow" : "green",
		content: count > 0 ? getCalloutContent(pageViewModel) : "",
	});
}
