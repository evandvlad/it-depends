import { Rec } from "~/lib/rec";
import type { ProgramFileExpert } from "../program-file-expert";
import type { ProcessorErrors, ProgramFileEntries } from "../values";
import type { DispatcherPort, ProgramFileItem, ProgramFileItems, ProgramFileProcessorPort } from "./values";

interface Params {
	items: ProgramFileItems;
	programFileExpert: ProgramFileExpert;
	dispatcherPort: DispatcherPort;
	programFileProcessorPort: ProgramFileProcessorPort;
}

export type { ProgramFileItem, ProgramFileItems, DispatcherPort, ProgramFileProcessorPort };

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
		const details = programFileExpert.getDetails(path);

		try {
			entries.set(path, programFileProcessorPort.process({ path, content, details }));
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
