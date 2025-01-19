import type { ModulePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { datalist } from "../../atoms/datalist";
import { list } from "../../atoms/list";

export function moduleDatalist(pageViewModel: ModulePageViewModel) {
	return datalist({
		items: [
			{ label: "Language", value: pageViewModel.language },
			{ label: "Full path", value: pageViewModel.fullPath },
			{
				label: "Package",
				value: pageViewModel.packageLinkData ? a(pageViewModel.packageLinkData) : "",
			},
			{
				label: "Incorrect imports",
				value: list({ items: pageViewModel.collectIncorrectImportItems((linkData) => ({ content: a(linkData) })) }),
			},
			{
				label: "Out of scope imports",
				value: list({
					items: pageViewModel.collectOutOfScopeImports((path) => ({ content: path })),
				}),
			},
			{ label: "Unparsed dynamic imports", value: String(pageViewModel.unparsedDynamicImports || "") },
			{
				label: "Unresolved full imports",
				value: list({ items: pageViewModel.collectUnresolvedFullImports((path) => ({ content: path })) }),
			},
			{
				label: "Unresolved full exports",
				value: list({ items: pageViewModel.collectUnresolvedFullExports((path) => ({ content: path })) }),
			},
			{
				label: "Shadowed export values",
				value: pageViewModel.shadowedExportValues.join(", "),
			},
		],
	});
}
