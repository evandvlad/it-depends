import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";
import { packageLink } from "../components/package-link";

interface Params {
	path: AbsoluteFsPath;
}

export function packagesCallout({ path }: Params, ctx: ComponentContext) {
	const { packages } = ctx.packages.get(path);

	return callout({
		title: `Packages ${counter({ value: packages.length })}`,
		content: list({
			items: packages.map((p) => packageLink({ path: p }, ctx)),
		}),
		color: "green",
		open: true,
	});
}
