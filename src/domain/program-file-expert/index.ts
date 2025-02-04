import { AppError } from "~/lib/errors";
import { getName } from "~/lib/fs-path";
import type { FSTree } from "~/lib/fs-tree";
import type { ExtraPackageEntries } from "~/values";
import { ImportSourceResolver } from "./import-source-resolver";
import {
	type Aliases,
	type ProgramFileDetails,
	declarationFileExtName,
	entryPointFileName,
	orderedByResolvingPriorityAcceptableFileExtNames,
	programFileDetailsByFileExtName,
} from "./values";

interface Params {
	settings: {
		aliases: Aliases;
		extraPackageEntries: ExtraPackageEntries;
	};
}

export type { ImportSourceResolver, ProgramFileDetails, Aliases };

export class ProgramFileExpert {
	#settings;

	constructor({ settings }: Params) {
		this.#settings = settings;
	}

	isAcceptableFile(path: string) {
		return orderedByResolvingPriorityAcceptableFileExtNames.some((extName) => path.endsWith(extName));
	}

	getDetails(path: string): ProgramFileDetails {
		if (path.endsWith(declarationFileExtName)) {
			return programFileDetailsByFileExtName[declarationFileExtName];
		}

		for (const acceptableFileExtName of orderedByResolvingPriorityAcceptableFileExtNames) {
			if (path.endsWith(acceptableFileExtName)) {
				return programFileDetailsByFileExtName[acceptableFileExtName];
			}
		}

		throw new AppError(`Unsupported extension name for file '${path}'`);
	}

	createImportSourceResolver({ fSTree }: { fSTree: FSTree }) {
		return new ImportSourceResolver({ fSTree, aliases: this.#settings.aliases });
	}

	getPackageEntryPoint(filePaths: string[]) {
		if (filePaths.length === 0) {
			return null;
		}

		for (const filePath of filePaths) {
			if (this.#settings.extraPackageEntries.filePaths.includes(filePath)) {
				return filePath;
			}
		}

		const entryPointNames = [...this.#settings.extraPackageEntries.fileNames, entryPointFileName];
		const orderedEntryPointFullNames = entryPointNames.flatMap((baseName) =>
			orderedByResolvingPriorityAcceptableFileExtNames.map((extName) => `${baseName}${extName}`),
		);

		const entryPointCandidates = filePaths.reduce((acc, filePath) => {
			const fileName = getName(filePath);
			const index = orderedEntryPointFullNames.indexOf(fileName);

			if (index !== -1) {
				acc.set(index, filePath);
			}

			return acc;
		}, new Map<number, string>());

		if (entryPointCandidates.size === 0) {
			return null;
		}

		const minIndex = Math.min(...entryPointCandidates.keys());
		return entryPointCandidates.get(minIndex)!;
	}
}
