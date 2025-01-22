import { Rec } from "~/lib/rec";
import type { ProgramFileExpert } from "../program-file-expert";
import { parseCode } from "./parser";
import {
	type DispatcherPort,
	type FileEntries,
	type FileEntry,
	type FileItem,
	type FileItems,
	type ParserErrors,
	ieValueAll,
} from "./values";

interface Params {
	fileItems: FileItems;
	programFileExpert: ProgramFileExpert;
	dispatcherPort: DispatcherPort;
}

export {
	ieValueAll,
	type FileEntries,
	type FileEntry,
	type FileItem,
	type ParserErrors,
	type FileItems,
	type DispatcherPort,
};

export async function transformFileItems({ fileItems, programFileExpert, dispatcherPort }: Params) {
	const fileEntries: FileEntries = new Rec();
	const parserErrors: ParserErrors = new Rec();

	dispatcherPort.dispatch("files-transformation:started");

	for await (const { path, content } of fileItems) {
		const { language, allowedJSXSyntax } = programFileExpert.getDetails(path);

		try {
			fileEntries.set(path, {
				path,
				language,
				content,
				ieItems: parseCode({ content, language, allowedJSXSyntax }),
			});

			dispatcherPort.dispatch("files-transformation:file-processed", { path });
		} catch (e) {
			const error = e as Error;
			parserErrors.set(path, error);
			dispatcherPort.dispatch("files-transformation:file-processing-failed", { path, error });
		}
	}

	dispatcherPort.dispatch("files-transformation:finished");

	return { fileEntries, parserErrors };
}
