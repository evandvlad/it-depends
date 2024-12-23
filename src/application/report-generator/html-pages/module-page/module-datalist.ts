import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { datalist } from "../atoms/datalist";
import { list } from "../atoms/list";
import { packageLink } from "../components/package-link";

interface Params {
	path: AbsoluteFsPath;
}

export function moduleDatalist({ path }: Params, ctx: ComponentContext) {
	const module = ctx.modules.get(path);

	return datalist({
		items: [
			{ label: "Full path", value: path },
			{ label: "Package", value: module.package ? packageLink({ path: module.package }, ctx) : "" },
			{ label: "Unparsed dynamic imports", value: String(module.unparsedDynamicImportsCount || "") },
			{
				label: "Unresolved full imports",
				value: list({ items: module.unresolvedFullImports.map(({ importPath }) => importPath) }),
			},
			{
				label: "Unresolved full exports",
				value: list({ items: module.unresolvedFullExports.map(({ importPath }) => importPath) }),
			},
			{
				label: "Shadowed export values",
				value: module.shadowedExportValues.join(", "),
			},
		],
	});
}
