import type { ModulesCollection, PackagesCollection, Summary } from "~/domain";
import type { FSTree } from "~/lib/fs-tree";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData, LinkTreeItem, LinkTreeNode } from "./values";

interface Params {
	version: string;
	fSTree: FSTree;
	pathInformer: PathInformer;
	summary: Summary;
	modulesCollection: ModulesCollection;
	packagesCollection: PackagesCollection;
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

	#modulesCollection;
	#packagesCollection;
	#summary;
	#fSTree;
	#pathInformer;

	constructor({ version, pathInformer, fSTree, summary, modulesCollection, packagesCollection }: Params) {
		super({ version, pathInformer, fSTree });

		this.#modulesCollection = modulesCollection;
		this.#packagesCollection = packagesCollection;
		this.#summary = summary;
		this.#fSTree = fSTree;
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

	collectModulesList<T>(handler: (linkData: LinkData) => T) {
		return this.#modulesCollection.toValues().map(({ path }) => handler(this.getModuleLinkData(path)));
	}

	collectModulesTree<T>(handler: (item: LinkTreeItem) => T) {
		return this.#collectModulesTree(this.#fSTree.shortRootPath, handler);
	}

	collectPackagesList<T>(handler: (linkData: LinkData) => T) {
		return this.#packagesCollection.toValues().map(({ path }) => handler(this.getPackageLinkData(path)));
	}

	collectPackagesTree<T>(handler: (item: LinkTreeItem) => T) {
		return this.#collectPackagesTree(this.#findRootPackages(this.#fSTree.shortRootPath), handler);
	}

	collectProcessorErrors<T>(handler: (params: { error: Error; linkData: LinkData }) => T) {
		return this.#summary.processorErrors.toEntries().map(([path, error]) =>
			handler({
				error,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectIncorrectImports<T>(
		handler: (params: { linkData: LinkData; importItems: Array<{ name: string; linkData: LinkData | null }> }) => T,
	) {
		return this.#summary.incorrectImports
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([path, importSources]) => {
				const importItems = importSources.map(({ importPath, filePath }) => ({
					name: importPath,
					linkData: filePath
						? { url: this.#pathInformer.getModuleHtmlPagePathByRealPath(filePath), content: importPath }
						: null,
				}));

				return handler({ linkData: this.getModuleLinkData(path), importItems });
			});
	}

	collectPossiblyUnusedExports<T>(
		handler: (params: { linkData: LinkData; values: string[]; isFullyUnused: boolean }) => T,
	) {
		return this.#summary.possiblyUnusedExportValues
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([path, values]) =>
				handler({
					values,
					linkData: this.getModuleLinkData(path),
					isFullyUnused: this.#modulesCollection.get(path).exports.size === values.length,
				}),
			);
	}

	collectOutOfScopeImports<T>(handler: (params: { linkData: LinkData; values: string[] }) => T) {
		return this.#summary.outOfScopeImports
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([path, values]) =>
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
		return this.#summary.unparsedDynamicImports
			.toEntries()
			.toSorted((first, second) => second[1] - first[1])
			.map(([path, num]) =>
				handler({
					num,
					linkData: this.getModuleLinkData(path),
				}),
			);
	}

	collectUnresolvedFullImports<T>(handler: (params: { linkData: LinkData; num: number }) => T) {
		return this.#summary.unresolvedFullImports
			.toEntries()
			.toSorted((first, second) => second[1] - first[1])
			.map(([path, num]) =>
				handler({
					num,
					linkData: this.getModuleLinkData(path),
				}),
			);
	}

	collectUnresolvedFullExports<T>(handler: (params: { linkData: LinkData; num: number }) => T) {
		return this.#summary.unresolvedFullExports
			.toEntries()
			.toSorted((first, second) => second[1] - first[1])
			.map(([path, num]) =>
				handler({
					num,
					linkData: this.getModuleLinkData(path),
				}),
			);
	}

	collectShadowedExportValues<T>(handler: (params: { linkData: LinkData; num: number }) => T) {
		return this.#summary.shadowedExportValues
			.toEntries()
			.toSorted((first, second) => second[1] - first[1])
			.map(([path, num]) =>
				handler({
					num,
					linkData: this.getModuleLinkData(path),
				}),
			);
	}

	#collectModulesTree<T>(path: string, handler: (item: LinkTreeItem) => T): LinkTreeNode<T>[] {
		return this.#fSTree.getNodeChildrenByPath(path).map(({ path, name }) => {
			const content = handler(
				this.#modulesCollection.has(path)
					? {
							name: this.#modulesCollection.get(path).name,
							linkData: {
								...this.getModuleLinkData(path),
								content: name,
							},
						}
					: { name, linkData: null },
			);

			return {
				content,
				title: this.#fSTree.getShortPathByPath(path),
				children: this.#collectModulesTree<T>(path, handler),
			};
		});
	}

	#collectPackagesTree<T>(paths: string[], handler: (item: LinkTreeItem) => T): LinkTreeNode<T>[] {
		return paths.map((path) => {
			const pack = this.#packagesCollection.get(path);

			return {
				content: handler({
					name: pack.name,

					linkData: {
						...this.getPackageLinkData(path),
						content: pack.name,
					},
				}),
				title: this.#fSTree.getShortPathByPath(path),
				children: this.#collectPackagesTree<T>(pack.packages, handler),
			};
		});
	}

	#findRootPackages(path: string): string[] {
		const node = this.#fSTree.getNodeByPath(path);

		if (this.#packagesCollection.has(node.path)) {
			return [node.path];
		}

		return this.#fSTree
			.getNodeChildrenByPath(path)
			.filter(({ isFile }) => !isFile)
			.flatMap((child) => this.#findRootPackages(child.path));
	}
}
