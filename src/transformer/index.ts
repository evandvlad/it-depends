import { getModuleFileInfo } from "../lib/module-details";
import {
	ModuleFile,
	FSPath,
	IEItem,
	ImportAliasMapper,
	Module,
	ModulesRegistry as IModulesRegistry,
	ParserErrors,
	EventSender,
} from "../values";
import { ImportSourceResolver } from "./import-source-resolver";
import { parseCode } from "./parser";
import { ModuleFactory } from "./module-factory";
import { bindModules } from "./binder";
import { ModulesRegistry } from "./modules-registry";

interface Options {
	files: AsyncGenerator<ModuleFile>;
	importAliasMapper: ImportAliasMapper;
	eventSender: EventSender;
}

interface Result {
	modulesRegistry: IModulesRegistry;
	parserErrors: ParserErrors;
}

export async function transformFiles({ files, importAliasMapper, eventSender }: Options): Promise<Result> {
	const ieItemsRecord: Record<FSPath, IEItem[]> = {};
	const parserErrors: ParserErrors = {};

	for await (const { path, code } of files) {
		const info = getModuleFileInfo(path);

		try {
			ieItemsRecord[path] = parseCode({ code, info });
			eventSender("file-processed", { path });
		} catch (e) {
			const error = e as Error;

			parserErrors[path] = error;
			eventSender("file-processing-failed", { path, error });
		}
	}

	eventSender("files-processing-completed", null);

	const filePaths = Object.keys(ieItemsRecord);
	const importSourceResolver = new ImportSourceResolver({ filePaths, importAliasMapper });

	const moduleFactory = new ModuleFactory(importSourceResolver);

	const modules = filePaths.reduce<Record<FSPath, Module>>((acc, filePath) => {
		acc[filePath] = moduleFactory.create({ filePath, ieItems: ieItemsRecord[filePath]! });
		return acc;
	}, {});

	return { modulesRegistry: bindModules(new ModulesRegistry(modules)), parserErrors };
}
