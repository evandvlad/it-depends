import { parse as libParse, ParserPlugin } from "@babel/parser";

import { ModuleFileInfo } from "../../values";
import { processAST } from "./ast-processor";

type Info = Pick<ModuleFileInfo, "language" | "allowedJSXSyntax">;

interface Options {
	code: string;
	info: Info;
}

function collectLibPlugins({ language, allowedJSXSyntax }: Info) {
	const plugins: ParserPlugin[] = ["decorators"];

	if (language === "typescript") {
		plugins.push("typescript");
	}

	if (allowedJSXSyntax) {
		plugins.push("jsx");
	}

	return plugins;
}

export function parseCode({ code, info }: Options) {
	const ast = libParse(code, {
		sourceType: "unambiguous",
		allowImportExportEverywhere: false,
		allowUndeclaredExports: false,
		plugins: collectLibPlugins(info),
	});

	return processAST(ast);
}
