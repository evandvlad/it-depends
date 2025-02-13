import type { Output } from "~/domain";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";

interface Params {
	version: string;
	path: string;
	pathInformer: PathInformer;
	output: Output;
}

export class PackagePageViewModel extends PageViewModel {
	readonly name;
	readonly shortPath;
	readonly fullPath;
	readonly entryPointLinkData;
	readonly parentPackageLinkData;
	readonly moduleLinks;
	readonly childPackageLinks;

	constructor({ version, path, pathInformer, output }: Params) {
		super({ version, pathInformer, output });

		const pack = output.packages.getPackage(path);

		this.name = pack.name;
		this.fullPath = path;
		this.shortPath = output.fs.getShortPath(path);

		this.entryPointLinkData = {
			...this.getModuleLinkData(pack.entryPoint),
			content: output.modules.getModule(pack.entryPoint).name,
			title: output.fs.getShortPath(pack.entryPoint),
			shortPath: output.fs.getShortPath(pack.entryPoint),
			fullPath: pack.entryPoint,
		};

		this.parentPackageLinkData = pack.parent
			? {
					...this.getPackageLinkData(pack.parent),
					content: output.packages.getPackage(pack.parent).name,
					title: output.fs.getShortPath(pack.parent),
					shortPath: output.fs.getShortPath(pack.parent),
					fullPath: pack.parent,
				}
			: null;

		this.moduleLinks = pack.modules.toSorted().map((path) => this.getModuleLinkData(path));
		this.childPackageLinks = pack.packages.toSorted().map((path) => this.getPackageLinkData(path));
	}
}
