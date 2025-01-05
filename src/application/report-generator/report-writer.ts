import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { AppError } from "../../lib/errors";
import { type AbsoluteFsPath, getParentPath } from "../../lib/fs-path";
import type { Rec } from "../../lib/rec";

interface Params {
	rootPath: AbsoluteFsPath;
	assetsPath: AbsoluteFsPath;
	staticAssetsPath: string;
	htmlPages: Rec<AbsoluteFsPath, string>;
}

async function writeHtmlPage({ path, html }: { path: AbsoluteFsPath; html: string }) {
	const parentPath = getParentPath(path);

	await mkdir(parentPath, { recursive: true });
	await writeFile(path, html);
}

export async function writeReport({ rootPath, assetsPath, staticAssetsPath, htmlPages }: Params) {
	try {
		await rm(rootPath, { recursive: true, force: true });
		await mkdir(rootPath);
	} catch (e) {
		throw new AppError(`Can't create directory by path: ${rootPath}`, { cause: e as Error });
	}

	await cp(staticAssetsPath, assetsPath, { recursive: true });

	await Promise.all(htmlPages.toEntries().map(([path, html]) => writeHtmlPage({ path, html })));
}
