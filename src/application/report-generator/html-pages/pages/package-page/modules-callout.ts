import type { PackagePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

export function modulesCallout(pageViewModel: PackagePageViewModel) {
	const items = pageViewModel.collectModuleLinks((linkData) => ({ content: a(linkData) }));

	return countCallout({
		title: "Modules",
		counter: { value: items.length },
		content: list({ items }),
		open: true,
	});
}
