import type { Packages } from "../../../domain";
import type { FSNavCursor } from "../../../lib/fs-nav-cursor";
import type { AbsoluteFsPath } from "../../../lib/fs-path";
import type { PathInformer } from "../path-informer";
import { PageViewModel } from "./page-view-model";
import type { LinkData } from "./values";

interface Params {
	version: string;
	path: AbsoluteFsPath;
	fsNavCursor: FSNavCursor;
	pathInformer: PathInformer;
	packages: Packages;
}

export class PackagePageViewModel extends PageViewModel {
	readonly fullPath;
	readonly shortPath;
	readonly entryPointLinkData;
	readonly parentPackageLinkData;

	#package;

	constructor({ version, path, pathInformer, fsNavCursor, packages }: Params) {
		super({ version, pathInformer, fsNavCursor });

		this.#package = packages.get(path);

		this.fullPath = path;
		this.shortPath = fsNavCursor.getShortPathByPath(path);
		this.entryPointLinkData = this.getModuleLinkData(this.#package.entryPoint);
		this.parentPackageLinkData = this.#package.parent ? this.getPackageLinkData(this.#package.parent) : null;
	}

	collectModuleLinks(handler: (linkData: LinkData) => string) {
		return this.#package.modules.map((path) => handler(this.getModuleLinkData(path)));
	}

	collectChildPackageLinks(handler: (linkData: LinkData) => string) {
		return this.#package.packages.map((path) => handler(this.getPackageLinkData(path)));
	}
}
