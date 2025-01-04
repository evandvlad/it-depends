import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { Rec } from "../../../../lib/rec";
import type { ComponentContext } from "../../values";
import { callout } from "../atoms/callout";
import { container } from "../atoms/container";
import { details } from "../atoms/details";
import { list } from "../atoms/list";
import { errorInfo } from "../components/error-info";
import { layout } from "../components/layout";
import { moduleLink } from "../components/module-link";
import { incorrectImportsCallout } from "./incorrect-imports-callout";
import { modulesCallout } from "./modules-callout";
import { packagesCallout } from "./packages-callout";

function numModuleItemsCallout(title: string, record: Rec<AbsoluteFsPath, number>, ctx: ComponentContext) {
	const { count, items } = record.reduce<{ count: number; items: string[] }>(
		(acc, num, path) => {
			acc.count += num;
			acc.items.push(`${moduleLink({ path }, ctx)} - ${num}`);
			return acc;
		},
		{ count: 0, items: [] },
	);

	return callout({
		title: `${title}: ${count}`,
		content: list({ items }),
		color: count > 0 ? "yellow" : "green",
	});
}

function moduleItemsWithValuesCallout(title: string, record: Rec<AbsoluteFsPath, string[]>, ctx: ComponentContext) {
	const { count, items } = record.reduce<{ count: number; items: string[] }>(
		(acc, values, path) => {
			acc.count += values.length;

			acc.items.push(
				details({
					title: `${moduleLink({ path }, ctx)} - ${values.length}`,
					content: values.join(", "),
				}),
			);

			return acc;
		},
		{ count: 0, items: [] },
	);

	return callout({
		title: `${title}: ${count}`,
		content: items.join(""),
		color: count > 0 ? "yellow" : "green",
	});
}

function unparsedDynamicImportCallout(ctx: ComponentContext) {
	return numModuleItemsCallout("Unparsed dynamic imports", ctx.summary.unparsedDynamicImportsCounter, ctx);
}

function unresolvedFullImportsCallout(ctx: ComponentContext) {
	return numModuleItemsCallout("Unresolved full imports", ctx.summary.unresolvedFullImportsCounter, ctx);
}

function unresolvedFullExportsCallout(ctx: ComponentContext) {
	return numModuleItemsCallout("Unresolved full exports", ctx.summary.unresolvedFullExportsCounter, ctx);
}

function shadowedExportValuesCallout(ctx: ComponentContext) {
	return numModuleItemsCallout("Shadowed export values", ctx.summary.shadowedExportValuesCounter, ctx);
}

function possiblyUnusedExportValuesCallout(ctx: ComponentContext) {
	return moduleItemsWithValuesCallout("Possibly unused export values", ctx.summary.possiblyUnusedExportValues, ctx);
}

function outOfScopeImportsCallout(ctx: ComponentContext) {
	return moduleItemsWithValuesCallout("Out of scope imports", ctx.summary.outOfScopeImports, ctx);
}

function emptyExportsCallout(ctx: ComponentContext) {
	const items = ctx.summary.emptyExports.map((path) => moduleLink({ path }, ctx));

	return callout({
		title: `Empty exports: ${items.length}`,
		content: list({ items }),
		color: items.length > 0 ? "yellow" : "green",
	});
}

function parserErrorsCallout(ctx: ComponentContext) {
	const errors = ctx.summary.parserErrors.toEntries().map(([path, error]) =>
		details({
			title: moduleLink({ path }, ctx),
			content: errorInfo({ error }),
		}),
	);

	return callout({
		title: `Parser errors: ${errors.length}`,
		content: errors.join(""),
		color: errors.length > 0 ? "red" : "green",
	});
}

export function indexPage(ctx: ComponentContext) {
	return layout(
		{
			content: container({
				items: [
					`<div style="width: 50%">
						${container({
							items: [modulesCallout(ctx), packagesCallout(ctx)],
						})}
					</div>`,
					`<div style="width: 50%">
						${container({
							items: [
								parserErrorsCallout(ctx),
								incorrectImportsCallout(ctx),
								possiblyUnusedExportValuesCallout(ctx),
								emptyExportsCallout(ctx),
								outOfScopeImportsCallout(ctx),
								unparsedDynamicImportCallout(ctx),
								unresolvedFullImportsCallout(ctx),
								unresolvedFullExportsCallout(ctx),
								shadowedExportValuesCallout(ctx),
							],
						})}
					</div>`,
				],
				direction: "horizontal",
				gap: "20px",
			}),
		},
		ctx,
	);
}
