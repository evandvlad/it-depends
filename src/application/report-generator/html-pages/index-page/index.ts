import type { IndexPageViewModel } from "../../page-view-models";
import { container } from "../atoms/container";
import { layout } from "../components/layout";
import { emptyExportsCallout } from "./empty-exports-callout";
import { incorrectImportsCallout } from "./incorrect-imports-callout";
import { modulesCallout } from "./modules-callout";
import { outOfScopeImportsCallout } from "./out-of-scope-imports-callout";
import { packagesCallout } from "./packages-callout";
import { parserErrorsCallout } from "./parser-errors-callout";
import { possiblyUnusedExportValuesCallout } from "./possibly-unused-export-values-callout";
import { shadowedExportValuesCallout } from "./shadowed-export-values-callout";
import { unparsedDynamicImportsCallout } from "./unparsed-dynamic-imports-callout";
import { unresolvedFullExportsCallout } from "./unresolved-full-exports-callout";
import { unresolvedFullImportsCallout } from "./unresolved-full-imports-callout";

export function indexPage(pageViewModel: IndexPageViewModel) {
	return layout(
		{
			content: container({
				items: [
					`<div style="width: 50%">
						${container({
							items: [modulesCallout(pageViewModel), packagesCallout(pageViewModel)],
						})}
					</div>`,
					`<div style="width: 50%">
						${container({
							items: [
								parserErrorsCallout(pageViewModel),
								incorrectImportsCallout(pageViewModel),
								possiblyUnusedExportValuesCallout(pageViewModel),
								emptyExportsCallout(pageViewModel),
								outOfScopeImportsCallout(pageViewModel),
								unparsedDynamicImportsCallout(pageViewModel),
								unresolvedFullImportsCallout(pageViewModel),
								unresolvedFullExportsCallout(pageViewModel),
								shadowedExportValuesCallout(pageViewModel),
							],
						})}
					</div>`,
				],
				direction: "horizontal",
				gap: "20px",
			}),
		},
		pageViewModel,
	);
}
