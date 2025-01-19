import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

export function emptyExportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectEmptyExports((linkData) => ({ content: a(linkData) }));

	return countCallout({
		title: "Empty exports",
		counter: { value: items.length },
		content: list({ items }),
		color: items.length > 0 ? "yellow" : "green",
	});
}
