import type { ProcessorErrors, ProgramFileDetails, ProgramFileEntries, ProgramFileEntry } from "~/domain";
import { assert } from "~/lib/errors";
import type { EventBusDispatcher } from "~/lib/event-bus";
import { Rec } from "~/lib/rec";

export type DispatcherPort = EventBusDispatcher<{
	"program-files-processing:started": [];
	"program-files-processing:program-file-processed": [{ path: string }];
	"program-files-processing:program-file-processing-failed": [{ path: string; error: Error }];
	"program-files-processing:finished": [];
}>;

export interface ProgramFileProcessorPort {
	process: (params: { path: string; content: string; details: ProgramFileDetails }) => ProgramFileEntry;
}

interface Params {
	dispatcherPort: DispatcherPort;
	programFileProcessorPort: ProgramFileProcessorPort;
	programFileDetailsGetter: (path: string) => ProgramFileDetails;
}

export class ProgramFileEntriesCollector {
	#dispatcherPort;
	#programFileProcessorPort;
	#programFileDetailsGetter;

	constructor({ programFileDetailsGetter, dispatcherPort, programFileProcessorPort }: Params) {
		this.#dispatcherPort = dispatcherPort;
		this.#programFileProcessorPort = programFileProcessorPort;
		this.#programFileDetailsGetter = programFileDetailsGetter;
	}

	collect(programFiles: Rec<string, string>) {
		const entries: ProgramFileEntries = new Rec();
		const processorErrors: ProcessorErrors = new Rec();

		this.#dispatcherPort.dispatch("program-files-processing:started");

		programFiles.forEach((content, path) => {
			const details = this.#programFileDetailsGetter(path);

			try {
				entries.set(path, this.#programFileProcessorPort.process({ path, content, details }));
				this.#dispatcherPort.dispatch("program-files-processing:program-file-processed", { path });
			} catch (e) {
				const error = e as Error;
				processorErrors.set(path, error);
				this.#dispatcherPort.dispatch("program-files-processing:program-file-processing-failed", {
					path,
					error,
				});
			}
		});

		this.#dispatcherPort.dispatch("program-files-processing:finished");

		assert(
			entries.size > 0,
			"No files have been found for processing. It seems like a problem with the configuration.",
		);

		return { entries, processorErrors };
	}
}
