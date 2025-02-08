import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

export function emptyExportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.emptyExports.map((linkData) => ({ content: a(linkData), value: linkData.content }));

	return countCallout({
		title: "Empty exports",
		counter: { value: items.length },
		content: entityList({ type: "module", items }),
		color: items.length > 0 ? "yellow" : "green",
	});
}
