import { type AbsoluteFsPath, joinPaths } from "../../../../lib/fs-path";

interface Params {
	assetsPath: AbsoluteFsPath;
	indexHtmlPagePath: AbsoluteFsPath;
	version: string;
	content: string;
	title?: string;
	header?: string;
}

export function layout({ title, content, assetsPath, indexHtmlPagePath, version, header = "" }: Params) {
	const pageTitle = `It-depends${title ? ` | ${title}` : ""}`;

	return `
		<!DOCTYPE html>
			<html lang="en">
			<head>
				<title>${pageTitle}</title>
				<meta charset="utf-8" />
				<link rel="stylesheet" href="${joinPaths(assetsPath, "index.css")}" type="text/css" />
			</head>
			<body>
				<main class="layout">
					<div class="layout__header">
						<div class="layout__header-content">
							<a class="layout__header-link" href="${indexHtmlPagePath}">It-depends</a>
							${header}
						</div>
					</div>
					<div class="layout__content">
						${content}
					</div>
					<footer class="layout__footer">
						<div class="layout__footer-content">
							Version: ${version}, Generated at ${new Date().toString()}
						</div>
					</footer>
				</main>
			</body>
		</html>
	`;
}
