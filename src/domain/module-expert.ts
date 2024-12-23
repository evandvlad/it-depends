import type { AbsoluteFsPath } from "../lib/fs-path";

const declarationFileExtName = ".d.ts";

export const orderedByResolvingPriorityAcceptableFileExtNames = [
	".ts",
	".tsx",
	".js",
	".jsx",
	declarationFileExtName,
] as const;

export type Language = "typescript" | "javascript";

export const entryPointFileName = "index";

type AcceptableFileExtName = (typeof orderedByResolvingPriorityAcceptableFileExtNames)[number];

interface ModuleDetails {
	language: Language;
	allowedJSXSyntax: boolean;
}

const moduleDetailsByAcceptableFileExtName: Record<AcceptableFileExtName, ModuleDetails> = {
	".d.ts": { language: "typescript", allowedJSXSyntax: false },
	".js": { language: "javascript", allowedJSXSyntax: true },
	".jsx": { language: "javascript", allowedJSXSyntax: true },
	".ts": { language: "typescript", allowedJSXSyntax: false },
	".tsx": { language: "typescript", allowedJSXSyntax: true },
};

export function getAcceptableFileExtNameByPath(path: AbsoluteFsPath): AcceptableFileExtName | null {
	if (path.endsWith(declarationFileExtName)) {
		return declarationFileExtName;
	}

	for (const acceptableFileExtName of orderedByResolvingPriorityAcceptableFileExtNames) {
		if (path.endsWith(acceptableFileExtName)) {
			return acceptableFileExtName;
		}
	}

	return null;
}

export function getModuleDetailsByAcceptedFileExtName(extName: AcceptableFileExtName) {
	return moduleDetailsByAcceptableFileExtName[extName];
}
