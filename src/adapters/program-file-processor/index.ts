import { type ParserPlugin, parse } from "@babel/parser";
import type { ProgramFileDetails } from "~/domain";
import { processAST } from "./ast-processor";

interface ProcessParams {
	path: string;
	content: string;
	details: ProgramFileDetails;
}

export class ProgramFileProcessor {
	process({ path, content, details }: ProcessParams) {
		const plugins: ParserPlugin[] = ["decorators"];

		if (details.language === "typescript") {
			plugins.push("typescript");
		}

		if (details.allowedJSXSyntax) {
			plugins.push("jsx");
		}

		const ast = parse(content, {
			sourceType: "unambiguous",
			allowImportExportEverywhere: false,
			allowUndeclaredExports: false,
			plugins,
		});

		return {
			path,
			content,
			language: details.language,
			ieItems: processAST(ast),
		};
	}
}
