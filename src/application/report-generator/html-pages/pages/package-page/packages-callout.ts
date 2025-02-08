import type { PackagePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

export function packagesCallout(pageViewModel: PackagePageViewModel) {
	const items = pageViewModel.childPackageLinks.map((linkData) => ({ content: a(linkData), value: linkData.content }));

	return countCallout({
		title: "Packages",
		counter: { value: items.length },
		content: entityList({ type: "module", items }),
		open: true,
	});
}
