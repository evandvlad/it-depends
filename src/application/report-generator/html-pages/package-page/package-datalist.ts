import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { datalist } from "../atoms/datalist";
import { moduleLink } from "../components/module-link";
import { packageLink } from "../components/package-link";

interface Params {
	path: AbsoluteFsPath;
}

export function packageDatalist({ path }: Params, ctx: ComponentContext) {
	const pack = ctx.packages.get(path);

	return datalist({
		items: [
			{ label: "Full path", value: path },
			{ label: "Entry point", value: moduleLink({ path: pack.entryPoint }, ctx) },
			{ label: "Parent package", value: pack.parent ? packageLink({ path: pack.parent }, ctx) : "" },
		],
	});
}
