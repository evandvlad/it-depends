import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { callout } from "../../atoms/callout";
import { card } from "../../atoms/card";
import { container } from "../../atoms/container";
import { counter } from "../../atoms/counter";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";

function getCalloutContent(pageViewModel: IndexPageViewModel) {
	const importItems = pageViewModel.collectUnresolvedFullImports(({ linkData, num }) => ({
		content: item({ mainContent: a(linkData), extraContent: counter({ value: num }) }),
	}));

	const exportItems = pageViewModel.collectUnresolvedFullExports(({ linkData, num }) => ({
		content: item({ mainContent: a(linkData), extraContent: counter({ value: num }) }),
	}));

	return container({
		items: [
			{ content: card({ title: "Imports", content: list({ items: importItems }) }) },
			{ content: card({ title: "Exports", content: list({ items: exportItems }) }) },
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
