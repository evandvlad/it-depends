import type { IndexPageViewModel } from "../../page-view-models";
import { a } from "../atoms/a";
import { callout } from "../atoms/callout";
import { counter } from "../atoms/counter";
import { details } from "../atoms/details";
import { errorInfo } from "../components/error-info";

export function parserErrorsCallout(pageViewModel: IndexPageViewModel) {
	const errors = pageViewModel.collectParserErrors(({ error, linkData }) =>
		details({
			title: a(linkData),
			content: errorInfo({ error }),
		}),
	);

	return callout({
		title: `Parser errors ${counter({ value: errors.length })}`,
		content: errors.join(""),
		color: errors.length > 0 ? "red" : "green",
	});
}
