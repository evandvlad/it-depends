import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { container } from "../atoms/container";
import { counter } from "../atoms/counter";
import { datalist } from "../atoms/datalist";
import { tabs } from "../atoms/tabs";
import { tree } from "../atoms/tree";
import { filterableList } from "../components/filtrable-list";

export function modulesCallout(pageViewModel: IndexPageViewModel) {
	const tabsContent = tabs({
		items: [
			{
				label: "Modules tree",
				content: tree({
					items: pageViewModel.collectModulesTree(({ name, linkData }) => (linkData ? a(linkData) : name)),
				}),
			},
			{
				label: "Modules list",
				content: filterableList({
					inputPlaceholder: "Filter modules...",
					items: pageViewModel.collectModulesList((linkData) => ({
						content: a(linkData),
						value: linkData.content,
					})),
				}),
			},
		],
	});

	return callout({
		title: `Modules ${counter({ value: pageViewModel.numOfModules, color: "white" })}`,
		content: container({
			items: [{ content: datalist({ items: pageViewModel.langCountList }) }, { content: tabsContent }],
		}),
		open: true,
		color: "green",
	});
}
