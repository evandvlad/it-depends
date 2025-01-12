import type { PackagePageViewModel } from "../../page-view-models";
import { container } from "../atoms/container";
import { headerHeading } from "../components/header-heading";
import { layout } from "../components/layout";
import { modulesCallout } from "./modules-callout";
import { packageDatalist } from "./package-datalist";
import { packagesCallout } from "./packages-callout";

export function packagePage(pageViewModel: PackagePageViewModel) {
	const title = `Package: ${pageViewModel.shortPath}`;

	return layout({
		title,
		assetsPath: pageViewModel.assetsPath,
		indexHtmlPagePath: pageViewModel.indexHtmlPagePath,
		version: pageViewModel.version,
		header: headerHeading({ content: title }),
		content: container({
			items: [
				`<div style="width: 60%">${packageDatalist(pageViewModel)}</div>`,
				`<div style="width: 40%">${container({ items: [modulesCallout(pageViewModel), packagesCallout(pageViewModel)] })}</div>`,
			],
			direction: "horizontal",
			gap: "20px",
		}),
	});
}
