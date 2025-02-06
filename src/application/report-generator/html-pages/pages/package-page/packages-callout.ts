import type { PackagePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

export function packagesCallout(pageViewModel: PackagePageViewModel) {
	const items = pageViewModel.childPackageLinks.map((linkData) => ({ content: a(linkData) }));

	return countCallout({
		title: "Packages",
		counter: { value: items.length },
		content: list({ items }),
		open: true,
	});
}
