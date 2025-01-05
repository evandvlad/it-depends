import type { PackagePageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";

export function modulesCallout(pageViewModel: PackagePageViewModel) {
	const items = pageViewModel.collectModuleLinks((linkData) => a(linkData));

	return callout({
		title: `Modules ${counter({ value: items.length })}`,
		content: list({
			items,
		}),
		color: "green",
		open: true,
	});
}
