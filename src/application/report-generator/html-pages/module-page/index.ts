import type { ModulePageViewModel } from "../../page-view-models";
import { container } from "../atoms/container";
import { frame } from "../atoms/frame";
import { headerHeading } from "../components/header-heading";
import { layout } from "../components/layout";
import { moduleCode } from "../components/module-code";
import { exportsCallout } from "./exports-callout";
import { importsCallout } from "./imports-callout";
import { moduleDatalist } from "./module-datalist";

export function modulePage(pageViewModel: ModulePageViewModel) {
	const title = `Module: ${pageViewModel.shortPath}`;

	const leftSection = `
		<div style="flex: 1">
			${container({
				items: [
					{ content: moduleDatalist(pageViewModel) },
					{ content: importsCallout(pageViewModel) },
					{ content: exportsCallout(pageViewModel) },
				],
			})}
		</div>
	`;

	const rightSection = `
		<div style="width: 990px">
			${frame({ content: moduleCode(pageViewModel) })}
		</div>
	`;

	return layout({
		assetsPath: pageViewModel.assetsPath,
		indexHtmlPagePath: pageViewModel.indexHtmlPagePath,
		version: pageViewModel.version,
		title,
		header: headerHeading({ content: title }),
		content: container({
			items: [{ content: leftSection }, { content: rightSection }],
			direction: "horizontal",
			gap: "20px",
		}),
	});
}
