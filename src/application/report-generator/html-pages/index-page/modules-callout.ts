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
		title: `Modules ${counter({ value: pageViewModel.numOfModules })}`,
		content: container({
			items: [
				datalist({
					borderColor: "white",
					items: pageViewModel.langCountList,
				}),
				tabs({
					items: [
						{
							label: "Module tree",
							content: tree({
								items: pageViewModel.collectModuleTree(({ name, linkData }) => (linkData ? a(linkData) : name)),
							}),
						},
						{
							label: "Module list",
							content: list({ items: pageViewModel.collectModuleList((linkData) => a(linkData)) }),
						},
					],
				}),
			],
		}),
		open: true,
		color: "green",
	});
}
