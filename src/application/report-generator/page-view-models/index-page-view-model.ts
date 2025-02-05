import type { Output } from "~/domain";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData, LinkTreeItem, LinkTreeNode } from "./values";

interface Params {
	version: string;
	pathInformer: PathInformer;
	output: Output;
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

	#output;
	#pathInformer;

	constructor({ version, pathInformer, output }: Params) {
		super({ version, pathInformer, output });

		this.#output = output;
		this.#pathInformer = pathInformer;

		this.numOfModules = this.#output.summary.languages.reduce((acc, num) => acc + num, 0);
		this.numOfPackages = this.#output.summary.packages;

		this.langCountList = this.#output.summary.languages
			.toEntries()
			.map(([lang, value]) => ({ label: lang, value: value.toString() }));

		this.numOfIncorrectImports = this.#output.summary.incorrectImports.reduce(
			(acc, imports) => acc + imports.length,
			0,
		);
		this.numOfOutOfScopeImports = this.#output.summary.outOfScopeImports.reduce(
			(acc, importPaths) => acc + importPaths.length,
			0,
		);

		this.numOfPossiblyUnusedExports = this.#output.summary.possiblyUnusedExportValues.reduce(
			(acc, values) => acc + values.length,
			0,
		);

		this.numOfUnresolvedFullIE =
			this.#output.summary.unresolvedFullImports.reduce((acc, value) => acc + value, 0) +
			this.#output.summary.unresolvedFullExports.reduce((acc, value) => acc + value, 0);

		this.numOfUnparsedDynamicImports = this.#output.summary.unparsedDynamicImports.reduce(
			(acc, value) => acc + value,
			0,
		);
		this.numOfShadowedExportValues = this.#output.summary.shadowedExportValues.reduce((acc, value) => acc + value, 0);
	}

	collectModulesList<T>(handler: (linkData: LinkData) => T) {
		return this.#output.modules.getAllModules().map(({ path }) => handler(this.getModuleLinkData(path)));
	}

	collectModulesTree<T>(handler: (item: LinkTreeItem) => T) {
		return this.#collectModulesTree(null, handler);
	}

	collectPackagesList<T>(handler: (linkData: LinkData) => T) {
		return this.#output.packages.getAllPackages().map(({ path }) => handler(this.getPackageLinkData(path)));
	}

	collectPackagesTree<T>(handler: (item: LinkTreeItem) => T) {
		return this.#collectPackagesTree(this.#findRootPackages(null), handler);
	}

	collectProcessorErrors<T>(handler: (params: { error: Error; linkData: LinkData }) => T) {
		return this.#output.summary.processorErrors.toEntries().map(([path, error]) =>
			handler({
				error,
				linkData: this.getModuleLinkData(path),
			}),
		);
	}

	collectIncorrectImports<T>(
		handler: (params: { linkData: LinkData; importItems: Array<{ name: string; linkData: LinkData | null }> }) => T,
	) {
		return this.#output.summary.incorrectImports
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
		return this.#output.summary.possiblyUnusedExportValues
			.toEntries()
			.toSorted((first, second) => second[1].length - first[1].length)
			.map(([path, values]) =>
				handler({
					values,
					linkData: this.getModuleLinkData(path),
					isFullyUnused: this.#output.modules.getModule(path).exports.size === values.length,
				}),
			);
	}

	collectOutOfScopeImports<T>(handler: (params: { linkData: LinkData; values: string[] }) => T) {
		return this.#output.summary.outOfScopeImports
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
		return this.#output.summary.emptyExports.map((path) => handler(this.getModuleLinkData(path)));
	}

	collectUnparsedDynamicImports<T>(handler: (params: { linkData: LinkData; num: number }) => T) {
		return this.#output.summary.unparsedDynamicImports
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
		return this.#output.summary.unresolvedFullImports
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
		return this.#output.summary.unresolvedFullExports
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
		return this.#output.summary.shadowedExportValues
			.toEntries()
			.toSorted((first, second) => second[1] - first[1])
			.map(([path, num]) =>
				handler({
					num,
					linkData: this.getModuleLinkData(path),
				}),
			);
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
}
