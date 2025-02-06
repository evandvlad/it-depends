import type { Language, Output } from "~/domain";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { CountableLinkItem, LinkData, LinkTreeItem, LinkTreeNode } from "./values";

interface Params {
	version: string;
	pathInformer: PathInformer;
	output: Output;
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
		const unparsedDynamicImports: CountableLinkItem[] = [];
		const unresolvedFullImports: CountableLinkItem[] = [];
		const unresolvedFullExports: CountableLinkItem[] = [];
		const shadowedExportValues: CountableLinkItem[] = [];

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
		this.unparsedDynamicImports = this.#sortCountableLinkItems(unparsedDynamicImports);
		this.unresolvedFullImports = this.#sortCountableLinkItems(unresolvedFullImports);
		this.unresolvedFullExports = this.#sortCountableLinkItems(unresolvedFullExports);
		this.shadowedExportValues = this.#sortCountableLinkItems(shadowedExportValues);

		this.processorErrors = this.#output.processorErrors.toEntries().map(([path, error]) => ({
			error,
			linkData: this.getModuleLinkData(path),
		}));

		this.emptyExports = this.#output.summary.emptyExports.map((path) => this.getModuleLinkData(path));

		this.incorrectImports = this.#output.summary.incorrectImports
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([path, imports]) => {
				const importItems = imports.map(({ importPath, filePath }) => ({
					name: importPath,
					linkData: filePath
						? { url: pathInformer.getModuleHtmlPagePathByRealPath(filePath), content: importPath }
						: null,
				}));

				return { linkData: this.getModuleLinkData(path), importItems };
			});

		this.possiblyUnusedExports = this.#output.summary.possiblyUnusedExportValues
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([path, values]) => ({
				values,
				linkData: this.getModuleLinkData(path),
				isFullyUnused: this.#output.modules.getModule(path).exports.size === values.length,
			}));

		this.outOfScopeImports = this.#output.summary.outOfScopeImports
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([path, values]) => ({
				values,
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
