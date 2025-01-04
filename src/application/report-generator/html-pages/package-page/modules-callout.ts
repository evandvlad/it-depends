import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";
import { moduleLink } from "../components/module-link";

interface Params {
	path: AbsoluteFsPath;
}

export function modulesCallout({ path }: Params, ctx: ComponentContext) {
	const { modules } = ctx.packages.get(path);

	return callout({
		title: `Modules ${counter({ value: modules.length })}`,
		content: list({
			items: modules.map((p) => moduleLink({ path: p }, ctx)),
		}),
		color: "green",
		open: true,
	});
}
