import libPath from "node:path";

import { ModuleFileInfo, FSPath, ImportPath } from "../values";
import { assert } from "../lib/errors";

const declarationFileExtName = ".d.ts";
const orderedAcceptableExtNames = [".ts", ".tsx", ".js", ".jsx", declarationFileExtName] as const;
const entryPointName = "index";

type ExtName = typeof orderedAcceptableExtNames[number];

interface ResolveEntryPointModuleOptions {
	filePaths: FSPath[];
	extraEntryFilePaths: FSPath[];
	extraEntryFileNames: string[];
}

const languageInfo: Record<ExtName, Pick<ModuleFileInfo, "language" | "allowedJSXSyntax">> = {
	".js": { language: "javascript", allowedJSXSyntax: true },
	".jsx": { language: "javascript", allowedJSXSyntax: true },
	".ts": { language: "typescript", allowedJSXSyntax: false },
	".tsx": { language: "typescript", allowedJSXSyntax: true },
	".d.ts": { language: "typescript", allowedJSXSyntax: false },
};

export function isAcceptableFile(path: FSPath) {
	return orderedAcceptableExtNames.some((extName) => path.endsWith(extName));
}

export function getModuleFileInfo(path: FSPath): ModuleFileInfo {
	assert(isAcceptableFile(path), `File by path "${path}" isn't acceptable by ext name`);

	const libInfo = libPath.parse(path);
	const extName = path.endsWith(declarationFileExtName) ? declarationFileExtName : (libInfo.ext as ExtName);

	const { language, allowedJSXSyntax } = languageInfo[extName];

	return {
		language,
		allowedJSXSyntax,
		fullName: libInfo.base,
	};
}

export function isRelativeImport(path: ImportPath) {
	return path === "." || path === ".." || path.startsWith("./") || path.startsWith("../");
}

export function getImportResolutionFSPaths(absoluteImportPath: ImportPath): FSPath[] {
	return [
		...orderedAcceptableExtNames.map((extName) => `${absoluteImportPath}${extName}`),
		...orderedAcceptableExtNames.map((extName) => `${absoluteImportPath}/${entryPointName}${extName}`),
	];
}

export function resolveEntryPointModule({
	filePaths,
	extraEntryFilePaths,
	extraEntryFileNames,
}: ResolveEntryPointModuleOptions): FSPath | null {
	for (const filePath of filePaths) {
		if (extraEntryFilePaths.includes(filePath)) {
			return filePath;
		}
	}

	const orderedEntryPointFullNames = [entryPointName, ...extraEntryFileNames].flatMap((baseName) =>
		orderedAcceptableExtNames.map((extName) => `${baseName}${extName}`),
	);

	const entryPointCandidates = filePaths.reduce((acc, filePath) => {
		const { fullName } = getModuleFileInfo(filePath);
		const index = orderedEntryPointFullNames.indexOf(fullName);

		if (index !== -1) {
			acc.set(index, filePath);
		}

		return acc;
	}, new Map<number, FSPath>());

	return entryPointCandidates.size > 0 ? entryPointCandidates.get(Math.min(...entryPointCandidates.keys()))! : null;
}
