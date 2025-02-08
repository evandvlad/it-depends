import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

export function incorrectImportsCallout(pageViewModel: IndexPageViewModel) {
	const items = pageViewModel.incorrectImports.map(({ linkData, importItems }) => ({
		content: a(linkData),
		value: linkData.content,
		count: importItems.length,
	}));

	const count = pageViewModel.incorrectImports.reduce((acc, { importItems }) => acc + importItems.length, 0);

	return countCallout({
		title: "Incorrect imports",
		counter: { value: count },
		content: entityList({ type: "module", items }),
		color: count > 0 ? "red" : "green",
	});
}
