import type { ModulePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { datalist } from "../atoms/datalist";
import { list } from "../atoms/list";

export function moduleDatalist(pageViewModel: ModulePageViewModel) {
	return datalist({
		items: [
			{ label: "Full path", value: pageViewModel.fullPath },
			{ label: "Language", value: pageViewModel.language },
			{
				label: "Package",
				value: pageViewModel.packageLinkData ? a(pageViewModel.packageLinkData) : "",
			},
			{
				label: "Incorrect imports",
				value: list({ items: pageViewModel.collectIncorrectImportItems((linkData) => a(linkData)) }),
			},
			{
				label: "Out of scope imports",
				value: list({ items: pageViewModel.outOfScopeImports }),
			},
			{ label: "Unparsed dynamic imports", value: String(pageViewModel.unparsedDynamicImports || "") },
			{
				label: "Unresolved full imports",
				value: list({ items: pageViewModel.unresolvedFullImports }),
			},
			{
				label: "Unresolved full exports",
				value: list({ items: pageViewModel.unresolvedFullExports }),
			},
			{
				label: "Shadowed export values",
				value: pageViewModel.shadowedExportValues.join(", "),
			},
		],
	});
}
