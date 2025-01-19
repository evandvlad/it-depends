import { delimiter } from "~/lib/fs-path";
import { NodesRegistry } from "./nodes-registry";

export class FSTree {
	readonly rootPath;
	readonly shortRootPath;

	#nodesRegistry;
	#rootNode;
	#shortRootNode;

	constructor(allFilePaths: string[]) {
		this.#nodesRegistry = NodesRegistry.create(allFilePaths);
		this.#rootNode = this.#nodesRegistry.rootNode;
		this.rootPath = this.#rootNode.path;

		this.#shortRootNode = this.#getShortRoot();
		this.shortRootPath = this.#shortRootNode.path;
	}

	getShortPathByPath(path: string) {
		if (!this.#shortRootNode.parent) {
			return path;
		}

		const rootPath = this.#shortRootNode.parent.path;
		const basePathLength = rootPath === delimiter ? rootPath.length : rootPath.length + 1;

		return path.slice(basePathLength) || path;
	}

	hasNodeByPath(path: string) {
		return this.#nodesRegistry.hasNode(path);
	}

	getNodeByPath(path: string) {
		return this.#nodesRegistry.getNode(path);
	}

	getNodeChildrenByPath(path: string) {
		const node = this.getNodeByPath(path);
		return node.children.toValues().toSorted((a, b) => Number(a.isFile) - Number(b.isFile));
	}

	#getShortRoot() {
		let parentNode = this.#rootNode;

		while (parentNode) {
			const children = this.getNodeChildrenByPath(parentNode.path);

			if (children.length === 0) {
				return this.#rootNode;
			}

			const firstChildNode = children[0]!;
			const isSingleFolder = children.length === 1 && !firstChildNode.isFile;

			if (!isSingleFolder) {
				return parentNode;
			}

			parentNode = firstChildNode;
		}

		return this.#rootNode;
	}
}
