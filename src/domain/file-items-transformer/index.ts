import type { EventBusDispatcher } from "../../lib/event-bus";
import { Rec } from "../../lib/rec";
import { getAcceptableFileExtNameByPath, getModuleDetailsByAcceptedFileExtName } from "../module-expert";
import { parseCode } from "./parser";
import {
	type DispatcherRecord,
	type FileEntries,
	type FileEntry,
	type FileItem,
	type FileItems,
	type ImportPath,
	type ParserErrors,
	ieValueAll,
} from "./values";

interface Params {
	fileItems: FileItems;
	dispatcher: EventBusDispatcher<DispatcherRecord>;
}

export {
	type FileEntries,
	type FileEntry,
	type FileItem,
	ieValueAll,
	type ParserErrors,
	type FileItems,
	type DispatcherRecord,
	type ImportPath,
};

export async function transformFileItems({ fileItems, dispatcher }: Params) {
	const fileEntries: FileEntries = new Rec();
	const parserErrors: ParserErrors = new Rec();

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

			dispatcher.dispatch("file-item-processed", { path });
		} catch (e) {
			const error = e as Error;
			parserErrors.set(path, error);
			dispatcher.dispatch("file-item-processing-failed", { path, error });
		}
	}

	dispatcher.dispatch("all-file-items-processed");

	return { fileEntries, parserErrors };
}
