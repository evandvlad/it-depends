import { ProgramFileProcessor } from "~/adapters/program-file-processor";
import { Domain, type ProgramFileItem, type ProgramFileItems, type Result } from "~/domain";
import { Rec } from "~/lib/rec";

export async function* createProgramFileItemsGenerator(items: ProgramFileItem[]): ProgramFileItems {
	for await (const item of items) {
		yield Promise.resolve(item);
	}
}

export function processProgramFileItems(items: ProgramFileItem[]): Promise<Result> {
	const domain = new Domain({
		dispatcherPort: {
			dispatch() {},
		},
		settings: {
			aliases: new Rec(),
			extraPackageEntries: { fileNames: [], filePaths: [] },
			pathFilter: () => true,
		},
		programFileProcessorPort: new ProgramFileProcessor(),
	});

	return domain.process(createProgramFileItemsGenerator(items));
}
