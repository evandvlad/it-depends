import { type ParserPlugin, parse } from "@babel/parser";
import type { Language } from "../program-file-expert";
import { processAST } from "./ast-processor";

interface Params {
	content: string;
	language: Language;
	allowedJSXSyntax: boolean;
}

export function parseCode({ content, language, allowedJSXSyntax }: Params) {
	const plugins: ParserPlugin[] = ["decorators"];

	if (language === "typescript") {
		plugins.push("typescript");
	}

	if (allowedJSXSyntax) {
		plugins.push("jsx");
	}

	const ast = parse(content, {
		sourceType: "unambiguous",
		allowImportExportEverywhere: false,
		allowUndeclaredExports: false,
		plugins,
	});

	return processAST(ast);
}
