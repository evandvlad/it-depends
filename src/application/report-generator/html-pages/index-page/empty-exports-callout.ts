import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { list } from "../atoms/list";

export function emptyExportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectEmptyExports((linkData) => a(linkData));

	return callout({
		title: `Empty exports ${counter({ value: items.length, color: "white" })}`,
		content: list({ items }),
		color: items.length > 0 ? "yellow" : "green",
	});
}
