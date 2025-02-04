import type { IndexPageViewModel } from "../../page-view-models";
import { container } from "../atoms/container";
import { layout } from "../components/layout";
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
	return layout({
		assetsPath: pageViewModel.assetsPath,
		indexHtmlPagePath: pageViewModel.indexHtmlPagePath,
		version: pageViewModel.version,
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
								possiblyUnusedExportsCallout(pageViewModel),
								emptyExportsCallout(pageViewModel),
								outOfScopeImportsCallout(pageViewModel),
								unparsedDynamicImportsCallout(pageViewModel),
								unresolvedFullIECallout(pageViewModel),
								shadowedExportValuesCallout(pageViewModel),
							],
						})}
					</div>`,
			],
			direction: "horizontal",
			gap: "20px",
		}),
	});
}
