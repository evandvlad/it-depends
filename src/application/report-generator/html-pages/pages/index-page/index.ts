import type { IndexPageViewModel } from "../../../page-view-models";
import { container } from "../../atoms/container";
import { layout } from "../../components/layout";
import { emptyExportsCallout } from "./empty-exports-callout";
import { incorrectImportsCallout } from "./incorrect-imports-callout";
import { modulesCallout } from "./modules-callout";
import { outOfScopeImportsCallout } from "./out-of-scope-imports-callout";
import { packagesCallout } from "./packages-callout";
import { parserErrorsCallout } from "./parser-errors-callout";
import { possiblyUnusedExportsCallout } from "./possibly-unused-exports-callout";
import { shadowedExportValuesCallout } from "./shadowed-export-values-callout";
import { unparsedDynamicImportsCallout } from "./unparsed-dynamic-imports-callout";
import { unresolvedFullIECallout } from "./unresolved-full-ie-callout";

export function indexPage(pageViewModel: IndexPageViewModel) {
	const leftSection = `
		<div style="width: 50%">
			${container({
				items: [{ content: modulesCallout(pageViewModel) }, { content: packagesCallout(pageViewModel) }],
			})}
		</div>
	`;

	const rightSection = `
		<div style="width: 50%">
			${container({
				items: [
					{ content: parserErrorsCallout(pageViewModel) },
					{ content: incorrectImportsCallout(pageViewModel) },
					{ content: possiblyUnusedExportsCallout(pageViewModel) },
					{ content: emptyExportsCallout(pageViewModel) },
					{ content: outOfScopeImportsCallout(pageViewModel) },
					{ content: unparsedDynamicImportsCallout(pageViewModel) },
					{ content: unresolvedFullIECallout(pageViewModel) },
					{ content: shadowedExportValuesCallout(pageViewModel) },
				],
			})}
		</div>
	`;

	return layout({
		version: pageViewModel.version,
		content: container({
			items: [{ content: leftSection }, { content: rightSection }],
			direction: "horizontal",
			gap: "20px",
		}),
		...pageViewModel.layoutParams,
	});
}
