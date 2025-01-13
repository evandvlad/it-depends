import { type FileItem, type FileItems, type Result, process } from "~/domain";
import { Rec } from "~/lib/rec";

type FileItemsTestInput = Array<Omit<FileItem, "path"> & { path: string }>;

export async function* createFileItemsGenerator(fileItems: FileItemsTestInput): FileItems {
	for await (const fileItem of fileItems) {
		yield Promise.resolve(fileItem as FileItem);
	}
}

export function processFileItems(fileItems: FileItemsTestInput): Promise<Result> {
	return process({
		fileItems: createFileItemsGenerator(fileItems),
		dispatcherPort: {
			dispatch() {},
		},
		settings: {
			aliases: new Rec(),
			extraPackageEntries: { fileNames: [], filePaths: [] },
		},
	});
}
