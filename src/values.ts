export type FSPath = string;
export type ImportPath = string;
export type IEValue = string;

export const ieValueAll = "*";

export type IEItem =
	| { type: "standard-import"; source: ImportPath; values: IEValue[] }
	| { type: "dynamic-import"; source: ImportPath | null }
	| { type: "re-export"; source: ImportPath; inputValues: IEValue[]; outputValues: IEValue[] }
	| { type: "standard-export"; values: IEValue[] };

type Language = "typescript" | "javascript";

export type EventName = "file-processed" | "file-processing-failed" | "files-processing-completed";

export interface EventData extends Record<EventName, unknown> {
	"file-processed": { path: FSPath };
	"file-processing-failed": { path: FSPath; error: Error };
	"files-processing-completed": null;
}

export type EventListener<T extends EventName> = (data: EventData[T]) => void;

export type EventSubscriber = <T extends EventName>(name: T, listener: EventListener<T>) => void;

export type EventSender = <T extends EventName>(name: T, data: EventData[T]) => void;

export interface FSTreeNode {
	isFile: boolean;
	path: FSPath;
	children: Map<FSPath, FSTreeNode>;
}

export interface FSTree {
	rootPath: FSPath;
	getNodeByPath(path: FSPath): FSTreeNode;
	getNodeChildrenByPath(path: FSPath): FSTreeNode[];
}

export interface ModuleFileInfo {
	fullName: string;
	language: Language;
	allowedJSXSyntax: boolean;
}

export type PathFilter = (filePath: FSPath) => boolean;

export type ImportAliasMapper = (importPath: ImportPath) => ImportPath | null;

export interface ModuleFile {
	path: FSPath;
	code: string;
}

export interface ImportSource {
	importPath: ImportPath;
	filePath?: FSPath;
}

export interface Import {
	importSource: ImportSource;
	values: IEValue[];
}

export interface Module {
	path: FSPath;
	language: Language;
	imports: Import[];
	exports: Record<IEValue, FSPath[]>;
	unresolvedFullImports: ImportSource[];
	unresolvedFullExports: ImportSource[];
	shadowedExportValues: IEValue[];
	unparsedDynamicImportsCount: number;
}

export interface ModulesRegistry {
	paths: FSPath[];
	hasByFilePath(filePath: FSPath): boolean;
	getByFilePath(filePath: FSPath): Module;
	toList(): Module[];
}

export interface Package {
	path: FSPath;
	entryPoint: FSPath;
	parent: FSPath | null;
	modules: FSPath[];
	packages: FSPath[];
}

export interface PackagesRegistry {
	paths: FSPath[];
	hasByPath(dirPath: FSPath): boolean;
	getByPath(dirPath: FSPath): Package;
	findByFilePath(filePath: FSPath): Package | null;
	toList(): Package[];
}

export type ParserErrors = Record<FSPath, Error>;

export interface Summary {
	packagesCount: number;
	modulesCounter: Record<Language, number>;
	unparsedDynamicImportsCounter: Record<FSPath, number>;
	unresolvedFullImportsCounter: Record<FSPath, number>;
	unresolvedFullExportsCounter: Record<FSPath, number>;
	shadowedExportValuesCounter: Record<FSPath, number>;
	outOfScopeImports: Record<FSPath, ImportPath[]>;
	possiblyUnusedExportValues: Record<FSPath, IEValue[]>;
	incorrectImports: Record<FSPath, ImportSource[]>;
	emptyExports: FSPath[];
	parserErrors: ParserErrors;
}
