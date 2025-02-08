import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { card } from "../../atoms/card";
import { container } from "../../atoms/container";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

function getCalloutContent(pageViewModel: IndexPageViewModel) {
	const importItems = pageViewModel.unresolvedFullImports.map(({ linkData, num }) => ({
		content: a(linkData),
		value: linkData.content,
		count: num,
	}));

	const exportItems = pageViewModel.unresolvedFullExports.map(({ linkData, num }) => ({
		content: a(linkData),
		value: linkData.content,
		count: num,
	}));

	return container({
		items: [
			{ content: card({ title: "Imports", content: entityList({ type: "module", items: importItems }) }) },
			{ content: card({ title: "Exports", content: entityList({ type: "module", items: exportItems }) }) },
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
