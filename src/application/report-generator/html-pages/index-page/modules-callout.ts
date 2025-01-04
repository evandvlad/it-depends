import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { container } from "../atoms/container";
import { counter } from "../atoms/counter";
import { datalist } from "../atoms/datalist";
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
	const count = ctx.summary.modulesCounter.reduce((acc, num) => acc + num, 0);
	const items = ctx.modules.toValues().map(({ path }) => moduleLink({ path }, ctx));

	const langDatalistContent = datalist({
		borderColor: "white",
		items: ctx.summary.modulesCounter.toEntries().map(([lang, value]) => ({ label: lang, value: value.toString() })),
	});

	const tabsContent = tabs({
		items: [
			{
				label: "Modules tree",
				content: tree({
					items: collectTreeItems({ path: ctx.fsNavCursor.shortRootPath }, ctx),
				}),
			},
			{ label: "Modules list", content: list({ items }) },
		],
	});

	return callout({
		title: `Modules ${counter({ value: count })}`,
		content: container({ items: [langDatalistContent, tabsContent] }),
		open: true,
		color: "green",
	});
}
