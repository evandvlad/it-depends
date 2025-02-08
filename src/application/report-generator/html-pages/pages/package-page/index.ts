import type { PackagePageViewModel } from "../../../page-view-models";
import { container } from "../../atoms/container";
import { headerHeading } from "../../components/header-heading";
import { layout } from "../../components/layout";
import { modulesCallout } from "./modules-callout";
import { packageDatalist } from "./package-datalist";
import { packagesCallout } from "./packages-callout";

export function packagePage(pageViewModel: PackagePageViewModel) {
	const title = `Package: ${pageViewModel.shortPath}`;

	const leftSection = `<div style="width: 50%">${packageDatalist(pageViewModel)}</div>`;

	const rightSection = `
		<div style="width: 50%">${container({
			items: [{ content: modulesCallout(pageViewModel) }, { content: packagesCallout(pageViewModel) }],
		})}</div>
	`;

	return layout({
		title,
		version: pageViewModel.version,
		header: headerHeading({ content: title }),
		content: container({
			items: [{ content: leftSection }, { content: rightSection }],
			direction: "horizontal",
			gap: "20px",
		}),
		...pageViewModel.layoutParams,
	});
}
