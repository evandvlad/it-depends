import type { ModulePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { datalist } from "../../atoms/datalist";
import { list } from "../../atoms/list";
import { moduleDropMenu } from "../../components/module-drop-menu";

export function moduleDatalist(pageViewModel: ModulePageViewModel) {
	return datalist({
		items: [
			{ label: "Language", value: pageViewModel.language },
			{
				label: "Name",
				value: `<span title="${pageViewModel.shortPath}">${pageViewModel.name}</span> ${moduleDropMenu({
					shortPath: pageViewModel.shortPath,
					fullPath: pageViewModel.fullPath,
				})}`,
			},
			{
				label: "Package",
				value: pageViewModel.packageLinkData ? a(pageViewModel.packageLinkData) : "",
			},
			{
				label: "Incorrect imports",
				value: list({ items: pageViewModel.incorrectImports.map((linkData) => ({ content: a(linkData) })) }),
			},
			{
				label: "Out of scope imports",
				value: list({
					items: pageViewModel.outOfScopeImports.map((path) => ({ content: path })),
				}),
			},
			{ label: "Unparsed dynamic imports", value: String(pageViewModel.unparsedDynamicImports || "") },
			{
				label: "Unresolved full imports",
				value: list({ items: pageViewModel.unresolvedFullImports.map((path) => ({ content: path })) }),
			},
			{
				label: "Unresolved full exports",
				value: list({ items: pageViewModel.unresolvedFullExports.map((path) => ({ content: path })) }),
			},
			{
				label: "Shadowed export values",
				value: pageViewModel.shadowedExportValues.join(", "),
			},
		],
	});
}
