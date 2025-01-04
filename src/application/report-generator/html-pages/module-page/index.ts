import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { container } from "../atoms/container";
import { frame } from "../atoms/frame";
import { headerHeading } from "../components/header-heading";
import { layout } from "../components/layout";
import { moduleCode } from "../components/module-code";
import { exportsCallout } from "./exports-callout";
import { importsCallout } from "./imports-callout";
import { moduleDatalist } from "./module-datalist";

interface Params {
	path: AbsoluteFsPath;
}

export function modulePage({ path }: Params, ctx: ComponentContext) {
	const title = `Module: ${ctx.fsNavCursor.getShortPathByPath(path)}`;

	return layout(
		{
			title,
			header: headerHeading({ content: title }),
			content: container({
				items: [
					`<div style="flex: 1">
						${container({
							items: [moduleDatalist({ path }, ctx), importsCallout({ path }, ctx), exportsCallout({ path }, ctx)],
						})}
					</div>`,
					`<div style="max-width: 990px">${frame({ content: moduleCode({ path }, ctx) })}</div>`,
				],
				direction: "horizontal",
				gap: "20px",
			}),
		},
		ctx,
	);
}
