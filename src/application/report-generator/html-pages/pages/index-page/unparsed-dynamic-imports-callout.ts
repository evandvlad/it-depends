import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { counter } from "../../atoms/counter";
import { item } from "../../atoms/item";
import { list } from "../../atoms/list";
import { countCallout } from "../../components/count-callout";

export function unparsedDynamicImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.collectUnparsedDynamicImports(({ linkData, num }) => ({
		content: item({ mainContent: a(linkData), extraContent: counter({ value: num }) }),
	}));

	return countCallout({
		title: "Unparsed dynamic imports",
		counter: { value: pageViewModel.numOfUnparsedDynamicImports },
		content: list({ items }),
		color: pageViewModel.numOfUnparsedDynamicImports > 0 ? "yellow" : "green",
	});
}
