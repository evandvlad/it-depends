import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";
import { tabs } from "../atoms/tabs";
import { type TreeItem, tree } from "../atoms/tree";
import { packageLink } from "../components/package-link";

function findRootPackages({ path }: { path: AbsoluteFsPath }, ctx: ComponentContext): AbsoluteFsPath[] {
	const { fsNavCursor, packages } = ctx;
	const node = fsNavCursor.getNodeByPath(path);

	if (packages.has(node.path)) {
		return [node.path];
	}

	return fsNavCursor
		.getNodeChildrenByPath(path)
		.filter(({ isFile }) => !isFile)
		.flatMap((child) => findRootPackages({ path: child.path }, ctx));
}

function collectTreeItems({ paths }: { paths: AbsoluteFsPath[] }, ctx: ComponentContext): TreeItem[] {
	const { packages } = ctx;

	return paths.map((path) => {
		const pack = packages.get(path);

		return {
			content: a({
				href: ctx.pathInformer.getPackageHtmlPagePathByRealPath(path),
				text: pack.name,
			}),
			children: collectTreeItems({ paths: pack.packages }, ctx),
		};
	});
}

function getTabs(ctx: ComponentContext) {
	const items = ctx.packages.toValues().map(({ path }) => packageLink({ path }, ctx));
	const treeItems = collectTreeItems({ paths: findRootPackages({ path: ctx.fsNavCursor.shortRootPath }, ctx) }, ctx);

	return tabs({
		items: [
			{ label: "Packages tree", content: tree({ items: treeItems }) },
			{ label: "Packages list", content: list({ items }) },
		],
	});
}

export function packagesCallout(ctx: ComponentContext) {
	return callout({
		title: `Packages ${counter({ value: ctx.summary.packagesCount })}`,
		content: ctx.summary.packagesCount > 0 ? getTabs(ctx) : "",
		color: "green",
		open: true,
	});
}
