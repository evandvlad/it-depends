import type { FSTree } from "~/lib/fs-tree";
import { Rec } from "~/lib/rec";
import type { ProgramFileExpert } from "../program-file-expert";
import type { ModulesCollection } from "../values";
import { PackageBuilder } from "./package-builder";

interface Params {
	fSTree: FSTree;
	programFileExpert: ProgramFileExpert;
	modulesCollection: ModulesCollection;
}

type PackageBuildersCollection = Rec<string, PackageBuilder>;

export class PackagesCollector {
	#fSTree;
	#modulesCollection;
	#programFileExpert;

	constructor({ fSTree, programFileExpert, modulesCollection }: Params) {
		this.#fSTree = fSTree;
		this.#programFileExpert = programFileExpert;
		this.#modulesCollection = modulesCollection;
	}

	collect() {
		const packageBuildersCollection: PackageBuildersCollection = new Rec();
		this.#collectPackageBuilders(packageBuildersCollection, this.#fSTree.rootPath);
		return this.#fillPackageBuilders(packageBuildersCollection).mapValue((builder) => builder.build());
	}

	#collectPackageBuilders(packageBuildersCollection: PackageBuildersCollection, parentPath: string) {
		const nodes = this.#fSTree.getNodeChildrenByPath(parentPath);

		const filePaths = nodes.filter(({ isFile }) => isFile).map(({ path }) => path);
		const packageEntryPoint = this.#programFileExpert.getPackageEntryPoint(filePaths);

		if (packageEntryPoint) {
			const builder = new PackageBuilder({ path: parentPath, entryPoint: packageEntryPoint });
			packageBuildersCollection.set(builder.path, builder);
		}

		nodes
			.filter(({ isFile }) => !isFile)
			.forEach(({ path }) => {
				this.#collectPackageBuilders(packageBuildersCollection, path);
			});
	}

	#fillPackageBuilders(packageBuildersCollection: PackageBuildersCollection) {
		packageBuildersCollection.forEach((builder) => {
			this.#fillPackageBuilder(packageBuildersCollection, builder, builder.path);
		});

		return packageBuildersCollection;
	}

	#fillPackageBuilder(
		packageBuildersCollection: PackageBuildersCollection,
		builder: PackageBuilder,
		currentPath: string,
	) {
		const subPaths: string[] = [];

		this.#fSTree.getNodeChildrenByPath(currentPath).forEach(({ path, isFile }) => {
			if (isFile) {
				builder.addModule(path);
				this.#modulesCollection.get(path).setPackage(builder.path);
				return;
			}

			if (packageBuildersCollection.has(path)) {
				builder.addPackage(path);
				packageBuildersCollection.get(path).setParent(builder.path);
				return;
			}

			subPaths.push(path);
		});

		subPaths.forEach((subPath) => {
			this.#fillPackageBuilder(packageBuildersCollection, builder, subPath);
		});
	}
}
