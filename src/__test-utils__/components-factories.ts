import { Domain, type ProcessorErrors, type ProgramFileEntry } from "~/domain";
import { Rec } from "~/lib/rec";

export function createProgramFileEntry(parts: Partial<ProgramFileEntry>): ProgramFileEntry {
	return {
		path: "",
		content: "",
		language: "typescript",
		ieItems: [],
		...parts,
	};
}

export function createDomain() {
	return new Domain({
		settings: {
			aliases: new Rec<string, string>(),
			pathFilter: () => true,
			extraPackageEntries: { fileNames: [] as string[], filePaths: [] as string[] },
		},
	});
}

export function createProcessParams({
	entries,
	processorErrors = new Rec<string, Error>(),
}: {
	entries: ProgramFileEntry[];
	processorErrors?: ProcessorErrors;
}) {
	return {
		processorErrors,
		entries: Rec.fromEntries(entries.map((entry) => [entry.path, entry])),
	};
}
