import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { details } from "../../atoms/details";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

export function outOfScopeImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.outOfScopeImports.map(({ linkData, values }) => ({
		content: details({
			title: a(linkData),
			content: values.join(", "),
		}),
		value: linkData.content,
		count: values.length,
	}));

	const count = pageViewModel.outOfScopeImports.reduce((acc, { values }) => acc + values.length, 0);

	return countCallout({
		title: "Out of scope imports",
		counter: { value: count },
		content: entityList({ type: "module", items }),
		color: count > 0 ? "yellow" : "green",
	});
}
