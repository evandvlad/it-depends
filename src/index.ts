import {
	PathFilter,
	ImportAliasMapper,
	ModulesRegistry,
	PackagesRegistry,
	Summary,
	FSPath,
	EventSubscriber,
	Module,
	Package,
	EventName,
	EventData,
	Import,
	ImportSource,
	ParserErrors,
} from "./values";
import { assert, AppError } from "./lib/errors";
import { EventHub } from "./lib/event-hub";
import { isAbsolutePath, normalizePath } from "./lib/fs-path";
import { FSTree } from "./lib/fs-tree";
import { loadFiles } from "./module-files-loader";
import { transformFiles } from "./transformer";
import { collectPackages } from "./packages-collector";
import { collectSummary } from "./summary-collector";

export type {
	PathFilter,
	ImportAliasMapper,
	ModulesRegistry,
	PackagesRegistry,
	Summary,
	Module,
	Package,
	EventName,
	EventData,
	Import,
	ImportSource,
	ParserErrors,
};

export { AppError };

export interface Options {
	paths: FSPath[];
	pathFilter?: PathFilter;
	importAliasMapper?: ImportAliasMapper;
	extraPackageEntryFileNames?: string[];
	extraPackageEntryFilePaths?: FSPath[];
}

export interface Result {
	modulesRegistry: ModulesRegistry;
	packagesRegistry: PackagesRegistry;
	summary: Summary;
}

export class ItDepends {
	#options: Required<Options>;
	#eventHub = new EventHub();

	on: EventSubscriber;

	constructor(options: Options) {
		this.#options = this.#assertAndPrepareOptions(options);

		this.on = this.#eventHub.on;
	}

	async run(): Promise<Result> {
		const { paths, pathFilter, importAliasMapper, extraPackageEntryFileNames, extraPackageEntryFilePaths } =
			this.#options;

		const files = loadFiles({ paths, filter: pathFilter });

		const { modulesRegistry, parserErrors } = await transformFiles({
			files,
			importAliasMapper,
			eventSender: this.#eventHub.send,
		});

		const fsTree = new FSTree(modulesRegistry.paths);

		const packagesRegistry = collectPackages({ fsTree, extraPackageEntryFileNames, extraPackageEntryFilePaths });
		const summary = collectSummary({ modulesRegistry, packagesRegistry, parserErrors });

		return { modulesRegistry, packagesRegistry, summary };
	}

	#assertAndPrepareOptions({
		paths,
		pathFilter = () => true,
		importAliasMapper = () => null,
		extraPackageEntryFileNames = [],
		extraPackageEntryFilePaths = [],
	}: Options): Required<Options> {
		assert(paths.length > 0, "Empty paths");
		this.#assertAllAbsolutePaths(paths, "All path should be absolute");
		this.#assertAllAbsolutePaths(extraPackageEntryFilePaths, "All paths for package entries should be absolute");

		return {
			pathFilter,
			importAliasMapper,
			extraPackageEntryFileNames,
			extraPackageEntryFilePaths: this.#normalizePaths(extraPackageEntryFilePaths),
			paths: this.#normalizePaths(paths),
		};
	}

	#assertAllAbsolutePaths(paths: FSPath[], message: string) {
		assert(
			paths.every((path) => isAbsolutePath(path)),
			message,
		);
	}

	#normalizePaths(paths: FSPath[]): FSPath[] {
		return paths.map((path) => normalizePath(path));
	}
}
