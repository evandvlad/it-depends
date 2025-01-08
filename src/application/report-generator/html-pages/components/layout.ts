import { joinPaths } from "../../../../lib/fs-path";
import type { PageViewModel } from "../../page-view-models";

interface Params {
	content: string;
	title?: string;
	header?: string;
}

export function layout({ title, content, header = "" }: Params, pageViewModel: PageViewModel) {
	const pageTitle = `It-depends${title ? ` | ${title}` : ""}`;

	return `
		<!DOCTYPE html>
			<html lang="en">
			<head>
				<title>${pageTitle}</title>
				<meta charset="utf-8" />
				<link rel="stylesheet" href="${joinPaths(pageViewModel.assetsPath, "index.css")}" type="text/css" />
			</head>
			<body>
				<main class="layout">
					<div class="layout__header">
						<div class="layout__header-content">
							<a class="layout__header-link" href="${pageViewModel.indexHtmlPagePath}">It-depends</a>
							${header}
						</div>
					</div>
					<div class="layout__content">
						${content}
					</div>
					<footer class="layout__footer">
						<div class="layout__footer-content">
							Version: ${pageViewModel.version}, Generated at ${new Date().toString()}
						</div>
					</footer>
				</main>
			</body>
		</html>
	`;
}
