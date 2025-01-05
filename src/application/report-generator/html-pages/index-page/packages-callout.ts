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
				label: "Package tree",
				content: tree({ items: pageViewModel.collectPackageTree(({ linkData }) => a(linkData!)) }),
			},
			{
				label: "Package list",
				content: list({ items: pageViewModel.collectPackageList((linkData) => a(linkData)) }),
			},
		],
	});
}

export function packagesCallout(pageViewModel: IndexPageViewModel) {
	return callout({
		title: `Packages ${counter({ value: pageViewModel.numOfPackages })}`,
		content: pageViewModel.numOfPackages > 0 ? getTabs(pageViewModel) : "",
		color: "green",
		open: true,
	});
}
