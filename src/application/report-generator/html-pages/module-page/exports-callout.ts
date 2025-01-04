import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { callout } from "../atoms/callout";
import { details } from "../atoms/details";
import { list } from "../atoms/list";
import { moduleLink } from "../components/module-link";

interface Params {
	path: AbsoluteFsPath;
}

export function exportsCallout({ path }: Params, ctx: ComponentContext) {
	const { exports } = ctx.modules.get(path);

	const { count, items } = exports.reduce<{ count: number; items: string[] }>(
		(acc, paths, value) => {
			acc.count += paths.length;

			acc.items.push(
				details({
					title: `${value}: ${paths.length}`,
					content: list({ items: paths.map((p) => moduleLink({ path: p }, ctx)) }),
				}),
			);

			return acc;
		},
		{ count: 0, items: [] },
	);

	return callout({
		title: `Exports: ${count}`,
		content: items.join(""),
		color: "green",
		open: true,
	});
}
