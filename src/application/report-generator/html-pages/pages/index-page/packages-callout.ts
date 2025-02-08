import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { tabs } from "../../atoms/tabs";
import { tree } from "../../atoms/tree";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

function getTabs(pageViewModel: IndexPageViewModel) {
	return tabs({
		items: [
			{
				label: "Packages tree",
				content: tree({ items: pageViewModel.collectPackagesTree(({ linkData }) => a(linkData!)) }),
			},
			{
				label: "Packages list",
				content: entityList({
					type: "package",
					items: pageViewModel.packagesList.map((linkData) => ({
						content: a(linkData),
						value: linkData.content,
					})),
				}),
			},
		],
	});
}

export function packagesCallout(pageViewModel: IndexPageViewModel) {
	const numOfPackages = pageViewModel.packagesList.length;

	return countCallout({
		title: "Packages",
		counter: { value: numOfPackages },
		content: numOfPackages > 0 ? getTabs(pageViewModel) : "",
	});
}
