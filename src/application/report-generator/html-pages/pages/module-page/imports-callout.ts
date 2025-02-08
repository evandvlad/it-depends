import type { ModulePageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { details } from "../../atoms/details";
import { countCallout } from "../../components/count-callout";
import { entityList } from "../../components/entity-list";

export function importsCallout(pageViewModel: ModulePageViewModel) {
	const items = pageViewModel.imports.map(({ name, linkData, values }) => ({
		content: details({
			title: linkData ? a(linkData) : name,
			content: values.join(", "),
		}),
		value: name,
		count: values.length,
	}));

	const count = pageViewModel.imports.reduce((acc, { values }) => acc + values.length, 0);

	return countCallout({
		title: "Imports",
		counter: { value: count },
		content: entityList({ type: "module", items }),
		color: "green",
	});
}
