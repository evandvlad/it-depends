import type { IndexPageViewModel } from "../../../page-view-models";
import { a } from "../../atoms/a";
import { details } from "../../atoms/details";
import { countCallout } from "../../components/count-callout";
import { errorInfo } from "../../components/error-info";

export function processorErrorsCallout(pageViewModel: IndexPageViewModel) {
	const errors = pageViewModel.collectProcessorErrors(({ error, linkData }) =>
		details({
			title: a(linkData),
			content: errorInfo({ error }),
		}),
	);

	return countCallout({
		title: "Processor errors",
		counter: { value: errors.length },
		content: errors.join(""),
		color: errors.length > 0 ? "red" : "green",
	});
}
