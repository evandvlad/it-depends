import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

export function unparsedDynamicImportsCallout(pageViewModel: IndexPageViewModel) {
	const count = pageViewModel.unparsedDynamicImports.reduce((acc, { num }) => acc + num, 0);

	const items = pageViewModel.unparsedDynamicImports.map(({ linkData, num }) => ({
		content: item({ mainContent: a(linkData), extraContent: counter({ value: num }) }),
	}));

	return countCallout({
		title: "Unparsed dynamic imports",
		counter: { value: count },
		content: list({ items }),
		color: count > 0 ? "yellow" : "green",
	});
}
