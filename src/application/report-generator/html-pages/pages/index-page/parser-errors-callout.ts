import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { details } from "../../atoms/details";
import { countCallout } from "../../components/count-callout";
import { errorInfo } from "../../components/error-info";

export function parserErrorsCallout(pageViewModel: IndexPageViewModel) {
	const errors = pageViewModel.collectParserErrors(({ error, linkData }) =>
		details({
			title: a(linkData),
			content: errorInfo({ error }),
		}),
	);

	return countCallout({
		title: "Parser errors",
		counter: { value: errors.length },
		content: errors.join(""),
		color: errors.length > 0 ? "red" : "green",
	});
}
