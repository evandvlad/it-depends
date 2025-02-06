import type { Language, Output } from "~/domain";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { CountableLinkItem, LinkData, LinkTreeItem, LinkTreeNode } from "./values";

interface Params {
	version: string;
	pathInformer: PathInformer;
	output: Output;
}

interface OutOfScopeImportItem {
	linkData: LinkData;
	values: string[];
}

interface PossiblyUnusedExportsItem {
	values: readonly string[];
	linkData: LinkData;
	isFullyUnused: boolean;
}

interface IncorrectImportItem {
	linkData: LinkData;
	importItems: Array<{ name: string; linkData: LinkData | null }>;
}

export class IndexPageViewModel extends PageViewModel {
	readonly langCountList;
	readonly modulesList;
	readonly packagesList;
	readonly processorErrors;
	readonly unparsedDynamicImports;
	readonly unresolvedFullImports;
	readonly unresolvedFullExports;
	readonly shadowedExportValues;
	readonly emptyExports;
	readonly incorrectImports;
	readonly possiblyUnusedExports;
	readonly outOfScopeImports;

	#output;

	constructor({ version, pathInformer, output }: Params) {
		super({ version, pathInformer, output });

		this.#output = output;

		const modules = this.#output.modules.getAllModules();
		const packages = this.#output.packages.getAllPackages();

		const langCounts: Record<Language, number> = {
			typescript: 0,
			javascript: 0,
		};

		const modulesList: LinkData[] = [];
		const packagesList: LinkData[] = [];
		const emptyExports: LinkData[] = [];
		const unparsedDynamicImports: CountableLinkItem[] = [];
		const unresolvedFullImports: CountableLinkItem[] = [];
		const unresolvedFullExports: CountableLinkItem[] = [];
		const shadowedExportValues: CountableLinkItem[] = [];
		const outOfScopeImports: OutOfScopeImportItem[] = [];
		const possiblyUnusedExports: PossiblyUnusedExportsItem[] = [];
		const incorrectImports: IncorrectImportItem[] = [];

		modules.forEach((module) => {
			const linkData = this.getModuleLinkData(module.path);

			langCounts[module.language] += 1;

			if (module.unparsedDynamicImports > 0) {
				unparsedDynamicImports.push({ linkData, num: module.unparsedDynamicImports });
			}

			if (module.unresolvedFullImports.length > 0) {
				unresolvedFullImports.push({ linkData, num: module.unresolvedFullImports.length });
			}

			if (module.unresolvedFullExports.length > 0) {
				unresolvedFullExports.push({ linkData, num: module.unresolvedFullExports.length });
			}

			if (module.shadowedExportValues.length > 0) {
				shadowedExportValues.push({ linkData, num: module.shadowedExportValues.length });
			}

			if (module.outOfScopeImports.length > 0) {
				outOfScopeImports.push({
					linkData,
					values: module.outOfScopeImports.map(({ importPath }) => importPath),
				});
			}

			if (!module.hasExports) {
				emptyExports.push(linkData);
			}

			if (module.possiblyUnusedExports.length > 0) {
				possiblyUnusedExports.push({
					values: module.possiblyUnusedExports,
					isFullyUnused: module.exportsByValue.size === module.possiblyUnusedExports.length,
					linkData,
				});
			}

			if (module.incorrectImports.length > 0) {
				incorrectImports.push({
					linkData,
					importItems: module.incorrectImports.map(({ importPath, filePath }) => ({
						name: importPath,
						linkData: filePath
							? { url: pathInformer.getModuleHtmlPagePathByRealPath(filePath), content: importPath }
							: null,
					})),
				});
			}

			modulesList.push(linkData);
		});

		packages.forEach((pack) => {
			packagesList.push(this.getPackageLinkData(pack.path));
		});

		this.langCountList = Object.entries(langCounts).map(([lang, count]) => ({
			label: lang as Language,
			value: count.toString(),
		}));

		this.modulesList = modulesList;
		this.packagesList = packagesList;
		this.emptyExports = emptyExports;
		this.unparsedDynamicImports = this.#sortCountableLinkItems(unparsedDynamicImports);
		this.unresolvedFullImports = this.#sortCountableLinkItems(unresolvedFullImports);
		this.unresolvedFullExports = this.#sortCountableLinkItems(unresolvedFullExports);
		this.shadowedExportValues = this.#sortCountableLinkItems(shadowedExportValues);

		this.outOfScopeImports = outOfScopeImports.toSorted((first, second) => second.values.length - first.values.length);

		this.possiblyUnusedExports = possiblyUnusedExports.toSorted(
			(first, second) => second.values.length - first.values.length,
		);

		this.incorrectImports = incorrectImports.toSorted(
			(first, second) => second.importItems.length - first.importItems.length,
		);

		this.processorErrors = this.#output.processorErrors.toEntries().map(([path, error]) => ({
			error,
			linkData: this.getModuleLinkData(path),
		}));
	}

	collectModulesTree<T>(handler: (item: LinkTreeItem) => T) {
		return this.#collectModulesTree(null, handler);
	}

	collectPackagesTree<T>(handler: (item: LinkTreeItem) => T) {
		return this.#collectPackagesTree(this.#findRootPackages(null), handler);
	}

	#collectModulesTree<T>(path: string | null, handler: (item: LinkTreeItem) => T): LinkTreeNode<T>[] {
		return this.#output.fs.getNodeChildren(path).map(({ path, name }) => {
			const content = handler(
				this.#output.modules.hasModule(path)
					? {
							name: this.#output.modules.getModule(path).name,
							linkData: {
								...this.getModuleLinkData(path),
								content: name,
							},
						}
					: { name, linkData: null },
			);

			return {
				content,
				title: this.#output.fs.getShortPath(path),
				children: this.#collectModulesTree<T>(path, handler),
			};
		});
	}

	#collectPackagesTree<T>(paths: readonly string[], handler: (item: LinkTreeItem) => T): LinkTreeNode<T>[] {
		return paths.map((path) => {
			const pack = this.#output.packages.getPackage(path);

			return {
				content: handler({
					name: pack.name,

					linkData: {
						...this.getPackageLinkData(path),
						content: pack.name,
					},
				}),
				title: this.#output.fs.getShortPath(path),
				children: this.#collectPackagesTree<T>(pack.packages, handler),
			};
		});
	}

	#findRootPackages(path: string | null): string[] {
		const node = this.#output.fs.getNode(path);

		if (this.#output.packages.hasPackage(node.path)) {
			return [node.path];
		}

		return this.#output.fs
			.getNodeChildren(path)
			.filter(({ isFile }) => !isFile)
			.flatMap((child) => this.#findRootPackages(child.path));
	}

	#sortCountableLinkItems(items: CountableLinkItem[]) {
		return items.toSorted((first, second) => second.num - first.num);
	}
}
