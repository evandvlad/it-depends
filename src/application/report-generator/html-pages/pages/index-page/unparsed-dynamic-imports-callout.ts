import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

export function unparsedDynamicImportsCallout(pageViewModel: IndexPageViewModel) {
	const count = pageViewModel.unparsedDynamicImports.reduce((acc, { num }) => acc + num, 0);

	const items = pageViewModel.unparsedDynamicImports.map(({ linkData, num }) => ({
		content: a(linkData),
		value: linkData.content,
		count: num,
	}));

	return countCallout({
		title: "Unparsed dynamic imports",
		counter: { value: count },
		content: entityList({ type: "module", items }),
		color: count > 0 ? "yellow" : "green",
	});
}
