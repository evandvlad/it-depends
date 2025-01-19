import { Rec } from "~/lib/rec";
import { getAcceptableFileExtNameByPath, getModuleDetailsByAcceptedFileExtName } from "../module-expert";
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

export async function transformFileItems({ fileItems, dispatcherPort }: Params) {
	const fileEntries: FileEntries = new Rec();
	const parserErrors: ParserErrors = new Rec();

	dispatcherPort.dispatch("files-transformation:started");

	for await (const { path, content } of fileItems) {
		const acceptableFileExtName = getAcceptableFileExtNameByPath(path);

		if (acceptableFileExtName === null) {
			continue;
		}

		const { language, allowedJSXSyntax } = getModuleDetailsByAcceptedFileExtName(acceptableFileExtName);

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
