import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { callout } from "../atoms/callout";
import { details } from "../atoms/details";
import { moduleLink } from "../components/module-link";

interface Params {
	path: AbsoluteFsPath;
}

export function importsCallout({ path }: Params, ctx: ComponentContext) {
	const { imports } = ctx.modules.get(path);

	const { count, items } = imports.reduce<{ count: number; items: string[] }>(
		(acc, { importSource, values }) => {
			const label = importSource.filePath ? moduleLink({ path: importSource.filePath }, ctx) : importSource.importPath;

			acc.count += values.length;

			acc.items.push(
				details({
					title: `${label} - ${values.length}`,
					content: values.join(", "),
					open: true,
				}),
			);

			return acc;
		},
		{ count: 0, items: [] },
	);

	return callout({
		title: `Imports: ${count}`,
		content: items.join(""),
		color: "green",
		open: true,
	});
}
