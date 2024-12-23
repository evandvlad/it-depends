import { type AbsoluteFsPath, shortFsPath } from "../fs-path";
import { NodesRegistry } from "./nodes-registry";

export class FSNavCursor {
	readonly rootPath;
	readonly shortRootPath;

	#nodesRegistry;
	#rootNode;
	#shortRootNode;

	constructor(allFilePaths: AbsoluteFsPath[]) {
		this.#nodesRegistry = NodesRegistry.create(allFilePaths);
		this.#rootNode = this.#nodesRegistry.rootNode;
		this.rootPath = this.#rootNode.path;

		this.#shortRootNode = this.#getShortRoot();
		this.shortRootPath = this.#shortRootNode.path;
	}

	getShortPathByPath(path: AbsoluteFsPath) {
		if (!this.#shortRootNode.parent) {
			return shortFsPath(path);
		}

		const basePathLengthWithEndedSlash = this.#shortRootNode.parent.path.length + 1;

		return shortFsPath(path.slice(basePathLengthWithEndedSlash) || path);
	}

	hasNodeByPath(path: AbsoluteFsPath) {
		return this.#nodesRegistry.hasNode(path);
	}

	getNodeByPath(path: AbsoluteFsPath) {
		return this.#nodesRegistry.getNode(path);
	}

	getNodeChildrenByPath(path: AbsoluteFsPath) {
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
