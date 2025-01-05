import type { ModulePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { datalist } from "../atoms/datalist";
import { list } from "../atoms/list";

export function moduleDatalist({
	fullPath,
	packageLinkData,
	unparsedDynamicImports,
	unresolvedFullImports,
	unresolvedFullExports,
	shadowedExportValues,
}: ModulePageViewModel) {
	return datalist({
		items: [
			{ label: "Full path", value: fullPath },
			{
				label: "Package",
				value: packageLinkData ? a(packageLinkData) : "",
			},
			{ label: "Unparsed dynamic imports", value: String(unparsedDynamicImports || "") },
			{
				label: "Unresolved full imports",
				value: list({ items: unresolvedFullImports }),
			},
			{
				label: "Unresolved full exports",
				value: list({ items: unresolvedFullExports }),
			},
			{
				label: "Shadowed export values",
				value: shadowedExportValues.join(", "),
			},
		],
	});
}
