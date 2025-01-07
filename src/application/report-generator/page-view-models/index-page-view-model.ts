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
	readonly numOfPossiblyUnusedExports;
	readonly numOfOutOfScopeImports;
	readonly numOfUnparsedDynamicImports;
	readonly numOfUnresolvedFullIE;
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
		this.numOfOutOfScopeImports = summary.outOfScopeImports.reduce((acc, importPaths) => acc + importPaths.length, 0);

		this.numOfPossiblyUnusedExports = summary.possiblyUnusedExportValues.reduce(
			(acc, values) => acc + values.length,
			0,
		);

		this.numOfUnresolvedFullIE =
			summary.unresolvedFullImports.reduce((acc, value) => acc + value, 0) +
			summary.unresolvedFullExports.reduce((acc, value) => acc + value, 0);

		this.numOfUnparsedDynamicImports = summary.unparsedDynamicImports.reduce((acc, value) => acc + value, 0);
		this.numOfShadowedExportValues = summary.shadowedExportValues.reduce((acc, value) => acc + value, 0);
	}

	collectModuleList<T>(handler: (linkData: LinkData) => T) {
		return this.#modules.toValues().map(({ path }) => handler(this.getModuleLinkData(path)));
	}

	collectModuleTree<T>(handler: (item: LinkTreeItem) => T) {
		return this.#collectModuleTree(this.#fsNavCursor.shortRootPath, handler);
	}

	collectPackageList<T>(handler: (linkData: LinkData) => T) {
		return this.#packages.toValues().map(({ path }) => handler(this.getPackageLinkData(path)));
	}

	collectPackageTree<T>(handler: (item: LinkTreeItem) => T) {
		return this.#collectPackageTree(this.#findRootPackages(this.#fsNavCursor.shortRootPath), handler);
	}

	collectParserErrors<T>(handler: (params: { error: Error; linkData: LinkData }) => T) {
		return this.#summary.parserErrors.toEntries().map(([path, error]) =>
			handler({
				error,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectIncorrectImports<T>(
		handler: (params: {
			moduleLinkData: LinkData;
			importItems: Array<{ name: string; linkData: LinkData | null }>;
		}) => T,
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

	collectPossiblyUnusedExports<T>(
		handler: (params: { linkData: LinkData; values: string[]; isFullyUnused: boolean }) => T,
	) {
		return this.#summary.possiblyUnusedExportValues.toEntries().map(([path, values]) =>
			handler({
				values,
				linkData: this.getModuleLinkData(path),
				isFullyUnused: this.#modules.get(path).exports.size === values.length,
			}),
		);
	}

	collectOutOfScopeImports<T>(handler: (params: { linkData: LinkData; values: ImportPath[] }) => T) {
		return this.#summary.outOfScopeImports.toEntries().map(([path, values]) =>
			handler({
				values,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectEmptyExports<T>(handler: (linkData: LinkData) => T) {
		return this.#summary.emptyExports.map((path) => handler(this.getModuleLinkData(path)));
	}

	collectUnparsedDynamicImports<T>(handler: (params: { linkData: LinkData; num: number }) => T) {
		return this.#summary.unparsedDynamicImports.toEntries().map(([path, num]) =>
			handler({
				num,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectUnresolvedFullImports<T>(handler: (params: { linkData: LinkData; num: number }) => T) {
		return this.#summary.unresolvedFullImports.toEntries().map(([path, num]) =>
			handler({
				num,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectUnresolvedFullExports<T>(handler: (params: { linkData: LinkData; num: number }) => T) {
		return this.#summary.unresolvedFullExports.toEntries().map(([path, num]) =>
			handler({
				num,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectShadowedExportValues<T>(handler: (params: { linkData: LinkData; num: number }) => T) {
		return this.#summary.shadowedExportValues.toEntries().map(([path, num]) =>
			handler({
				num,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	#collectModuleTree<T>(path: AbsoluteFsPath, handler: (item: LinkTreeItem) => T): LinkTreeNode<T>[] {
		return this.#fsNavCursor.getNodeChildrenByPath(path).map(({ path, name }) => {
			const content = handler(
				this.#modules.has(path)
					? {
							name: this.#modules.get(path).name,
							linkData: {
								...this.getModuleLinkData(path),
								content: name,
							},
						}
					: { name, linkData: null },
			);

			return {
				content,
				title: this.#fsNavCursor.getShortPathByPath(path),
				children: this.#collectModuleTree<T>(path, handler),
			};
		});
	}

	#collectPackageTree<T>(paths: AbsoluteFsPath[], handler: (item: LinkTreeItem) => T): LinkTreeNode<T>[] {
		return paths.map((path) => {
			const pack = this.#packages.get(path);

			return {
				content: handler({
					name: pack.name,

					linkData: {
						...this.getPackageLinkData(path),
						content: pack.name,
					},
				}),
				title: this.#fsNavCursor.getShortPathByPath(path),
				children: this.#collectPackageTree<T>(pack.packages, handler),
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
