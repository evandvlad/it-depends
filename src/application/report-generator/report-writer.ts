import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { AppError, assertNever } from "../../lib/errors";
import { type AbsoluteFsPath, getParentPath } from "../../lib/fs-path";
import type { PathInformer } from "./path-informer";
import { type ReportHtmlPageContentType, type ReportHtmlPagesContent, reportHtmlPagesContentTypes } from "./values";

interface Params {
	pathInformer: PathInformer;
	staticAssetsPath: string;
	htmlPagesContent: ReportHtmlPagesContent;
}

async function writeHtmlPage({ path, html }: { path: AbsoluteFsPath; html: string }) {
	const parentPath = getParentPath(path);

	await mkdir(parentPath, { recursive: true });
	await writeFile(path, html);
}

function getHtmlPagesByContentType({
	pathInformer,
	htmlPageContentType,
	htmlPagesContent,
}: {
	pathInformer: PathInformer;
	htmlPageContentType: ReportHtmlPageContentType;
	htmlPagesContent: ReportHtmlPagesContent;
}) {
	switch (htmlPageContentType) {
		case "index":
			return [{ path: pathInformer.indexHtmlPagePath, html: htmlPagesContent[htmlPageContentType] }];

		case "module":
			return htmlPagesContent[htmlPageContentType].toEntries().map(([path, html]) => ({
				path: pathInformer.getModuleHtmlPagePathByRealPath(path),
				html,
			}));

		case "package":
			return htmlPagesContent[htmlPageContentType].toEntries().map(([path, html]) => ({
				path: pathInformer.getPackageHtmlPagePathByRealPath(path),
				html,
			}));

		default:
			assertNever(htmlPageContentType);
	}
}

export async function writeReport({ pathInformer, htmlPagesContent, staticAssetsPath }: Params) {
	try {
		await rm(pathInformer.rootPath, { recursive: true, force: true });
		await mkdir(pathInformer.rootPath);
	} catch (e) {
		throw new AppError(`Can't create directory by path: ${pathInformer.rootPath}`, { cause: e as Error });
	}

	await cp(staticAssetsPath, pathInformer.assetsPath, { recursive: true });

	const htmlPages = reportHtmlPagesContentTypes.flatMap((htmlPageContentType) =>
		getHtmlPagesByContentType({ htmlPageContentType, pathInformer, htmlPagesContent }),
	);

	await Promise.all(htmlPages.map(({ path, html }) => writeHtmlPage({ path, html })));
}
