import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { list } from "../atoms/list";
import { tabs } from "../atoms/tabs";
import { type TreeItem, tree } from "../atoms/tree";
import { moduleLink } from "../components/module-link";

function collectTreeItems({ path }: { path: AbsoluteFsPath }, ctx: ComponentContext): TreeItem[] {
	const { fsNavCursor, modules } = ctx;

	return fsNavCursor.getNodeChildrenByPath(path).map(({ path, name }) => ({
		content: modules.has(path)
			? a({
					href: ctx.pathInformer.getModuleHtmlPagePathByRealPath(path),
					text: modules.get(path).name,
				})
			: name,
		children: collectTreeItems({ path }, ctx),
	}));
}

export function modulesCallout(ctx: ComponentContext) {
	const { count, info } = ctx.summary.modulesCounter.reduce<{ count: number; info: string[] }>(
		(acc, num, language) => {
			acc.count += num;
			acc.info.push(`${language} - ${num}`);
			return acc;
		},
		{ count: 0, info: [] },
	);

	const items = ctx.modules.toValues().map(({ path }) => moduleLink({ path }, ctx));

	return callout({
		title: `Modules: ${count} (${info.join(", ")})`,
		content: tabs({
			items: [
				{
					label: "Modules tree",
					content: tree({
						items: collectTreeItems({ path: ctx.fsNavCursor.shortRootPath }, ctx),
					}),
				},
				{ label: "Modules list", content: list({ items }) },
			],
		}),
		open: true,
		color: "green",
	});
}
