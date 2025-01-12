import { type FileItem, type FileItems, type Result, process } from "~/domain";

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
			importAliasMapper() {
				return null;
			},
			extraPackageEntries: { fileNames: [], filePaths: [] },
		},
	});
}
