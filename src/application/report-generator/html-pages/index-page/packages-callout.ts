import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { tabs } from "../atoms/tabs";
import { tree } from "../atoms/tree";
import { filterableList } from "../components/filtrable-list";

function getTabs(pageViewModel: IndexPageViewModel) {
	return tabs({
		items: [
			{
				label: "Packages tree",
				content: tree({ items: pageViewModel.collectPackagesTree(({ linkData }) => a(linkData!)) }),
			},
			{
				label: "Packages list",
				content: filterableList({
					inputPlaceholder: "Filter packages...",
					items: pageViewModel.collectPackagesList((linkData) => ({
						content: a(linkData),
						value: linkData.content,
					})),
				}),
			},
		],
	});
}

export function packagesCallout(pageViewModel: IndexPageViewModel) {
	return callout({
		title: `Packages ${counter({ value: pageViewModel.numOfPackages, color: "white" })}`,
		content: pageViewModel.numOfPackages > 0 ? getTabs(pageViewModel) : "",
		color: "green",
	});
}
