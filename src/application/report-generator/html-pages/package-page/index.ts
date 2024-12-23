import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { container } from "../atoms/container";
import { headerHeading } from "../components/header-heading";
import { layout } from "../components/layout";
import { modulesCallout } from "./modules-callout";
import { packageDatalist } from "./package-datalist";
import { packagesCallout } from "./packages-callout";

interface Params {
	path: AbsoluteFsPath;
}

export function packagePage({ path }: Params, ctx: ComponentContext) {
	const title = `Package: ${ctx.fsNavCursor.getShortPathByPath(path)}`;

	return layout(
		{
			title,
			header: headerHeading({ content: title }),
			content: container({
				items: [
					`<div style="width: 50%">
						${packageDatalist({ path }, ctx)}
					</div>`,
					`<div style="width: 50%">
						${container({
							items: [modulesCallout({ path }, ctx), packagesCallout({ path }, ctx)],
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
