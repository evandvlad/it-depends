import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { container } from "../../atoms/container";
import { datalist } from "../../atoms/datalist";
import { tabs } from "../../atoms/tabs";
import { tree } from "../../atoms/tree";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

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
				content: entityList({
					items: pageViewModel.modulesList.map((linkData) => ({
						content: a(linkData),
						value: linkData.content,
					})),
				}),
			},
		],
	});

	return countCallout({
		title: "Modules",
		counter: { value: pageViewModel.modulesList.length },
		content: container({
			items: [{ content: datalist({ items: pageViewModel.langCountList }) }, { content: tabsContent }],
		}),
		open: true,
	});
}
