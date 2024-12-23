import type { ComponentContext } from "../../values";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { details } from "../atoms/details";
import { list } from "../atoms/list";
import { moduleLink } from "../components/module-link";

export function incorrectImportsCallout(ctx: ComponentContext) {
	const { count, items } = ctx.summary.incorrectImports.reduce<{ count: number; items: string[] }>(
		(acc, importSources, path) => {
			acc.count += importSources.length;

			const items = importSources.map(({ importPath, filePath }) =>
				filePath
					? a({ href: ctx.pathInformer.getModuleHtmlPagePathByRealPath(filePath), text: importPath })
					: importPath,
			);

			acc.items.push(
				details({
					title: `${moduleLink({ path }, ctx)} - ${importSources.length}`,
					content: list({ items }),
				}),
			);

			return acc;
		},
		{ count: 0, items: [] },
	);

	return callout({
		title: `Incorrect imports: ${count}`,
		content: items.join(""),
		color: count > 0 ? "red" : "green",
	});
}
