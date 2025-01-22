import { type ParserPlugin, parse } from "@babel/parser";
import type { ProgramFileDetails } from "~/domain";
import { processAST } from "./ast-processor";

interface ProcessParams {
	content: string;
	programFileDetails: ProgramFileDetails;
}

export class ProgramFileProcessor {
	process({ content, programFileDetails }: ProcessParams) {
		const plugins: ParserPlugin[] = ["decorators"];

		if (programFileDetails.language === "typescript") {
			plugins.push("typescript");
		}

		if (programFileDetails.allowedJSXSyntax) {
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
}
