import type { Rec } from "~/lib/rec";

export const declarationFileExtName = ".d.ts";
export const entryPointFileName = "index";

export const orderedByResolvingPriorityAcceptableFileExtNames = [
	".ts",
	".tsx",
	".js",
	".jsx",
	declarationFileExtName,
] as const;

export const programFileDetailsByFileExtName: Record<AcceptableFileExtName, ProgramFileDetails> = {
	".d.ts": { language: "typescript", allowedJSXSyntax: false },
	".js": { language: "javascript", allowedJSXSyntax: true },
	".jsx": { language: "javascript", allowedJSXSyntax: true },
	".ts": { language: "typescript", allowedJSXSyntax: false },
	".tsx": { language: "typescript", allowedJSXSyntax: true },
};

type AcceptableFileExtName = (typeof orderedByResolvingPriorityAcceptableFileExtNames)[number];

export interface ProgramFileDetails {
	language: Language;
	allowedJSXSyntax: boolean;
}

export type Language = "typescript" | "javascript";

export type Aliases = Rec<string, string>;

export interface ImportSource {
	importPath: string;
	filePath?: string;
}
