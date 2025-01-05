import type { PackagePageViewModel } from "../../page-view-models";
import { container } from "../atoms/container";
import { headerHeading } from "../components/header-heading";
import { layout } from "../components/layout";
import { modulesCallout } from "./modules-callout";
import { packageDatalist } from "./package-datalist";
import { packagesCallout } from "./packages-callout";

export function packagePage(pageViewModel: PackagePageViewModel) {
	const title = `Package: ${pageViewModel.shortPath}`;

	return layout(
		{
			title,
			header: headerHeading({ content: title }),
			content: container({
				items: [
					`<div style="width: 50%">
						${packageDatalist(pageViewModel)}
					</div>`,
					`<div style="width: 50%">
						${container({
							items: [modulesCallout(pageViewModel), packagesCallout(pageViewModel)],
						})}
					</div>`,
				],
				direction: "horizontal",
				gap: "20px",
			}),
		},
		pageViewModel,
	);
}
