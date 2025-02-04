import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { container } from "../atoms/container";
import { counter } from "../atoms/counter";
import { datalist } from "../atoms/datalist";
import { list } from "../atoms/list";
import { tabs } from "../atoms/tabs";
import { tree } from "../atoms/tree";

export function modulesCallout(pageViewModel: IndexPageViewModel) {
	return callout({
		title: `Modules ${counter({ value: pageViewModel.numOfModules, color: "white" })}`,
		content: container({
			items: [
				datalist({
					items: pageViewModel.langCountList,
				}),
				tabs({
					items: [
						{
							label: "Modules tree",
							content: tree({
								items: pageViewModel.collectModulesTree(({ name, linkData }) => (linkData ? a(linkData) : name)),
							}),
						},
						{
							label: "Modules list",
							content: list({ items: pageViewModel.collectModulesList((linkData) => a(linkData)) }),
						},
					],
				}),
			],
		}),
		open: true,
		color: "green",
	});
}
