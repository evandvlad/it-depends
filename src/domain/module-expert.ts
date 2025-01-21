import { assert } from "~/lib/errors";

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

function getAcceptableFileExtNameByPath(path: string): AcceptableFileExtName | null {
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

export function isAcceptableFile(path: string) {
	return orderedByResolvingPriorityAcceptableFileExtNames.some((extName) => path.endsWith(extName));
}

export function getModuleDetails(path: string) {
	const extName = getAcceptableFileExtNameByPath(path);
	assert(extName !== null, `Unsupported extension name for file '${path}'`);

	return moduleDetailsByAcceptableFileExtName[extName];
}
