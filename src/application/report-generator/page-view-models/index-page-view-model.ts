import type { ImportPath, Modules, Packages, Summary } from "../../../domain";
import type { FSNavCursor } from "../../../lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "../../../lib/fs-path";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData, LinkTreeItem, LinkTreeNode } from "./values";

interface Params {
	version: string;
	fsNavCursor: FSNavCursor;
	pathInformer: PathInformer;
	summary: Summary;
	modules: Modules;
	packages: Packages;
}

export class IndexPageViewModel extends PageViewModel {
	readonly numOfModules;
	readonly numOfPackages;
	readonly langCountList;
	readonly numOfIncorrectImports;
	readonly numOfPossiblyUnusedExportValues;
	readonly numOfOutOfScopeImports;
	readonly numOfUnparsedDynamicImports;
	readonly numOfUnresolvedFullImports;
	readonly numOfUnresolvedFullExports;
	readonly numOfShadowedExportValues;

	#modules;
	#packages;
	#summary;
	#fsNavCursor;
	#pathInformer;

	constructor({ version, pathInformer, fsNavCursor, summary, modules, packages }: Params) {
		super({ version, pathInformer, fsNavCursor });

		this.#modules = modules;
		this.#packages = packages;
		this.#summary = summary;
		this.#fsNavCursor = fsNavCursor;
		this.#pathInformer = pathInformer;

		this.numOfModules = summary.languages.reduce((acc, num) => acc + num, 0);
		this.numOfPackages = summary.packages;

		this.langCountList = summary.languages
			.toEntries()
			.map(([lang, value]) => ({ label: lang, value: value.toString() }));

		this.numOfIncorrectImports = summary.incorrectImports.reduce((acc, importSources) => acc + importSources.length, 0);

		this.numOfPossiblyUnusedExportValues = summary.possiblyUnusedExportValues.reduce(
			(acc, values) => acc + values.length,
			0,
		);

		this.numOfOutOfScopeImports = summary.outOfScopeImports.reduce((acc, importPaths) => acc + importPaths.length, 0);
		this.numOfUnparsedDynamicImports = summary.unparsedDynamicImports.reduce((acc, value) => acc + value, 0);
		this.numOfUnresolvedFullImports = summary.unresolvedFullImports.reduce((acc, value) => acc + value, 0);
		this.numOfUnresolvedFullExports = summary.unresolvedFullExports.reduce((acc, value) => acc + value, 0);
		this.numOfShadowedExportValues = summary.shadowedExportValues.reduce((acc, value) => acc + value, 0);
	}

	collectModuleList(handler: (linkData: LinkData) => string) {
		return this.#modules.toValues().map(({ path }) => handler(this.getModuleLinkData(path)));
	}

	collectModuleTree(handler: (item: LinkTreeItem) => string) {
		return this.#collectModuleTree(this.#fsNavCursor.shortRootPath, handler);
	}

	collectPackageList(handler: (linkData: LinkData) => string) {
		return this.#packages.toValues().map(({ path }) => handler(this.getPackageLinkData(path)));
	}

	collectPackageTree(handler: (item: LinkTreeItem) => string) {
		return this.#collectPackageTree(this.#findRootPackages(this.#fsNavCursor.shortRootPath), handler);
	}

	collectParserErrors(handler: (params: { error: Error; linkData: LinkData }) => string) {
		return this.#summary.parserErrors.toEntries().map(([path, error]) =>
			handler({
				error,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectIncorrectImports(
		handler: (params: {
			moduleLinkData: LinkData;
			importItems: Array<{ name: string; linkData: LinkData | null }>;
		}) => string,
	) {
		return this.#summary.incorrectImports.toEntries().map(([path, importSources]) => {
			const importItems = importSources.map(({ importPath, filePath }) => ({
				name: importPath,
				linkData: filePath
					? { url: this.#pathInformer.getModuleHtmlPagePathByRealPath(filePath), content: importPath }
					: null,
			}));

			return handler({ moduleLinkData: this.getModuleLinkData(path), importItems });
		});
	}

	collectPossiblyUnusedExportValues(handler: (params: { linkData: LinkData; values: string[] }) => string) {
		return this.#summary.possiblyUnusedExportValues.toEntries().map(([path, values]) =>
			handler({
				values,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectOutOfScopeImports(handler: (params: { linkData: LinkData; values: ImportPath[] }) => string) {
		return this.#summary.outOfScopeImports.toEntries().map(([path, values]) =>
			handler({
				values,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectEmptyExports(handler: (linkData: LinkData) => string) {
		return this.#summary.emptyExports.map((path) => handler(this.getModuleLinkData(path)));
	}

	collectUnparsedDynamicImports(handler: (params: { linkData: LinkData; num: number }) => string) {
		return this.#summary.unparsedDynamicImports.toEntries().map(([path, num]) =>
			handler({
				num,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectUnresolvedFullImports(handler: (params: { linkData: LinkData; num: number }) => string) {
		return this.#summary.unresolvedFullImports.toEntries().map(([path, num]) =>
			handler({
				num,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectUnresolvedFullExports(handler: (params: { linkData: LinkData; num: number }) => string) {
		return this.#summary.unresolvedFullExports.toEntries().map(([path, num]) =>
			handler({
				num,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectShadowedExportValues(handler: (params: { linkData: LinkData; num: number }) => string) {
		return this.#summary.shadowedExportValues.toEntries().map(([path, num]) =>
			handler({
				num,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	#collectModuleTree(path: AbsoluteFsPath, handler: (item: LinkTreeItem) => string): LinkTreeNode[] {
		return this.#fsNavCursor.getNodeChildrenByPath(path).map(({ path, name }) => {
			const content = handler(
				this.#modules.has(path)
					? { name: this.#modules.get(path).name, linkData: this.getModuleLinkData(path) }
					: { name, linkData: null },
			);

			return {
				content,
				children: this.#collectModuleTree(path, handler),
			};
		});
	}

	#collectPackageTree(paths: AbsoluteFsPath[], handler: (item: LinkTreeItem) => string): LinkTreeNode[] {
		return paths.map((path) => {
			const pack = this.#packages.get(path);

			return {
				content: handler({
					name: pack.name,
					linkData: this.getPackageLinkData(path),
				}),
				children: this.#collectPackageTree(pack.packages, handler),
			};
		});
	}

	#findRootPackages(path: AbsoluteFsPath): AbsoluteFsPath[] {
		const node = this.#fsNavCursor.getNodeByPath(path);

		if (this.#packages.has(node.path)) {
			return [node.path];
		}

		return this.#fsNavCursor
			.getNodeChildrenByPath(path)
			.filter(({ isFile }) => !isFile)
			.flatMap((child) => this.#findRootPackages(child.path));
	}
}
