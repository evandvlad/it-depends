import type { PackagePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";

export function packagesCallout(pageViewModel: PackagePageViewModel) {
	const items = pageViewModel.collectChildPackageLinks((linkData) => ({ content: a(linkData) }));

	return callout({
		title: `Packages ${counter({ value: items.length, color: "white" })}`,
		content: list({ items }),
		color: "green",
		open: true,
	});
}
