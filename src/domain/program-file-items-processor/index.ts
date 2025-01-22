import { Rec } from "~/lib/rec";
import type { ProgramFileExpert } from "../program-file-expert";
import {
	type DispatcherPort,
	type IEItem,
	type ProcessorErrors,
	type ProgramFileEntries,
	type ProgramFileEntry,
	type ProgramFileItem,
	type ProgramFileItems,
	type ProgramFileProcessorPort,
	ieValueAll,
} from "./values";

interface Params {
	items: ProgramFileItems;
	programFileExpert: ProgramFileExpert;
	dispatcherPort: DispatcherPort;
	programFileProcessorPort: ProgramFileProcessorPort;
}

export {
	ieValueAll,
	type IEItem,
	type ProgramFileEntries,
	type ProgramFileEntry,
	type ProgramFileItem,
	type ProgramFileItems,
	type ProcessorErrors,
	type DispatcherPort,
	type ProgramFileProcessorPort,
};

export async function processProgramFileItems({
	items,
	programFileExpert,
	dispatcherPort,
	programFileProcessorPort,
}: Params) {
	const entries: ProgramFileEntries = new Rec();
	const processorErrors: ProcessorErrors = new Rec();

	dispatcherPort.dispatch("program-files-processing:started");

	for await (const { path, content } of items) {
		const programFileDetails = programFileExpert.getDetails(path);

		try {
			entries.set(path, {
				path,
				content,
				language: programFileDetails.language,
				ieItems: programFileProcessorPort.process({ content, programFileDetails }),
			});

			dispatcherPort.dispatch("program-files-processing:program-file-processed", { path });
		} catch (e) {
			const error = e as Error;
			processorErrors.set(path, error);
			dispatcherPort.dispatch("program-files-processing:program-file-processing-failed", { path, error });
		}
	}

	dispatcherPort.dispatch("program-files-processing:finished");

	return { entries, processorErrors };
}
