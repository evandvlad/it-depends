import type { FSNavCursor } from "~/lib/fs-nav-cursor";
import { type AbsoluteFsPath, absoluteFsPath, getParentPath, joinPaths } from "~/lib/fs-path";
import type { ImportPath } from "../file-items-transformer";
import { entryPointFileName, orderedByResolvingPriorityAcceptableFileExtNames } from "../module-expert";
import type { Aliases, ImportSource } from "./values";

interface Params {
	fsNavCursor: FSNavCursor;
	aliases: Aliases;
}

export class ImportSourceResolver {
	#fsNavCursor;
	#aliases;

	constructor({ fsNavCursor, aliases }: Params) {
		this.#fsNavCursor = fsNavCursor;
		this.#aliases = aliases;
	}

	resolve({ filePath, importPath }: { filePath: AbsoluteFsPath; importPath: ImportPath }) {
		const importSource: ImportSource = {
			importPath,
		};

		const resolvedFilePath = this.#resolvePath(filePath, importPath);

		if (resolvedFilePath) {
			importSource.filePath = resolvedFilePath;
		}

		return importSource;
	}

	#isRelativeImport(path: ImportPath) {
		return path === "." || path === ".." || path.startsWith("./") || path.startsWith("../");
	}

	#resolvePath(filePath: AbsoluteFsPath, importPath: ImportPath) {
		const absoluteImportPath = this.#calcAbsoluteImportPath(filePath, importPath);

		if (!absoluteImportPath) {
			return null;
		}

		const candidates = this.#getImportResolutionFSPaths(absoluteImportPath);

		return candidates.find((importPathCandidate) => this.#fsNavCursor.hasNodeByPath(importPathCandidate)) ?? null;
	}

	#calcAbsoluteImportPath(filePath: AbsoluteFsPath, importPath: ImportPath) {
		const isRelativeImport = this.#isRelativeImport(importPath);

		if (isRelativeImport) {
			const dirPath = getParentPath(filePath);
			return joinPaths(dirPath, importPath);
		}

		for (const [name, path] of this.#aliases.toEntries()) {
			const prefix = `${name}/`;

			if (importPath.startsWith(prefix)) {
				return joinPaths(path, importPath.slice(prefix.length));
			}
		}

		return null;
	}

	#getImportResolutionFSPaths(absoluteImportPath: AbsoluteFsPath) {
		return [
			...orderedByResolvingPriorityAcceptableFileExtNames.map((extName) =>
				absoluteFsPath(`${absoluteImportPath}${extName}`),
			),
			...orderedByResolvingPriorityAcceptableFileExtNames.map((extName) =>
				joinPaths(absoluteImportPath, `${entryPointFileName}${extName}`),
			),
		];
	}
}
