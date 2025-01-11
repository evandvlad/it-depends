import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";
import { tabs } from "../atoms/tabs";
import { tree } from "../atoms/tree";

function getTabs(pageViewModel: IndexPageViewModel) {
	return tabs({
		items: [
			{
				label: "Packages tree",
				content: tree({ items: pageViewModel.collectPackagesTree(({ linkData }) => a(linkData!)) }),
			},
			{
				label: "Packages list",
				content: list({ items: pageViewModel.collectPackagesList((linkData) => a(linkData)) }),
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
