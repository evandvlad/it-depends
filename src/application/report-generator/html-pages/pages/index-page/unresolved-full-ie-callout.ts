import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { card } from "../../atoms/card";
import { container } from "../../atoms/container";
import { counter } from "../../atoms/counter";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

function getCalloutContent(pageViewModel: IndexPageViewModel) {
	const importItems = pageViewModel.unresolvedFullImports.map(({ linkData, num }) => ({
		content: item({ mainContent: a(linkData), extraContent: counter({ value: num }) }),
	}));

	const exportItems = pageViewModel.unresolvedFullExports.map(({ linkData, num }) => ({
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
	const count = pageViewModel.unresolvedFullImports
		.concat(pageViewModel.unresolvedFullExports)
		.reduce((acc, { num }) => acc + num, 0);

	return countCallout({
		title: "Unresolved full imports/exports",
		counter: { value: count },
		color: count > 0 ? "yellow" : "green",
		content: count > 0 ? getCalloutContent(pageViewModel) : "",
	});
}
