import type { Output } from "~/domain";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData } from "./values";

interface Params {
	version: string;
	path: string;
	pathInformer: PathInformer;
	output: Output;
}

export class PackagePageViewModel extends PageViewModel {
	readonly fullPath;
	readonly shortPath;
	readonly entryPointLinkData;
	readonly parentPackageLinkData;

	#package;

	constructor({ version, path, pathInformer, output }: Params) {
		super({ version, pathInformer, output });

		this.#package = output.packages.getPackage(path);

		this.fullPath = path;
		this.shortPath = output.fs.getShortPath(path);
		this.entryPointLinkData = this.getModuleLinkData(this.#package.entryPoint);
		this.parentPackageLinkData = this.#package.parent ? this.getPackageLinkData(this.#package.parent) : null;
	}

	collectModuleLinks<T>(handler: (linkData: LinkData) => T) {
		return this.#package.modules.toSorted().map((path) => handler(this.getModuleLinkData(path)));
	}

	collectChildPackageLinks<T>(handler: (linkData: LinkData) => T) {
		return this.#package.packages.toSorted().map((path) => handler(this.getPackageLinkData(path)));
	}
}
