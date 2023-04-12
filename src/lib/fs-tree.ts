import { FSPath, FSTreeNode, FSTree as IFSTree } from "../values";
import { getPathBreadcrumbs } from "../lib/fs-path";
import { assert } from "../lib/errors";

function getPathsWithoutRoot(paths: string[]) {
	return paths.slice(1);
}

function buildFSTree(filePaths: FSPath[]): FSTreeNode {
	function createFSTreeNode(path: FSPath, isFile: boolean): FSTreeNode {
		return {
			path,
			isFile,
			children: new Map(),
		};
	}

	function attachChildToTree(parent: FSTreeNode, paths: string[]) {
		if (paths.length === 0) {
			return;
		}

		const [path, ...restPaths] = paths as [string, ...string[]];

		if (!parent.children.has(path)) {
			const node = createFSTreeNode(path, restPaths.length === 0);

			parent.children.set(path, node);
		}

		attachChildToTree(parent.children.get(path)!, restPaths);
	}

	const rootPath = getPathBreadcrumbs(filePaths[0]!)[0]!;
	const rootNode = createFSTreeNode(rootPath, false);

	filePaths.forEach((filePath) => {
		const paths = getPathBreadcrumbs(filePath);
		attachChildToTree(rootNode, getPathsWithoutRoot(paths));
	});

	return rootNode;
}

export class FSTree implements IFSTree {
	#rootNode: FSTreeNode;

	constructor(filePaths: FSPath[]) {
		assert(filePaths.length > 0, "File paths list is empty");
		this.#rootNode = buildFSTree(filePaths);
	}

	get rootPath() {
		return this.#rootNode.path;
	}

	getNodeByPath(path: FSPath) {
		const paths = getPathBreadcrumbs(path);

		return getPathsWithoutRoot(paths).reduce((parent, currentPath) => {
			assert(parent.children.has(currentPath), `Node by path "${path}" wasn't found`);
			return parent.children.get(currentPath)!;
		}, this.#rootNode);
	}

	getNodeChildrenByPath(path: FSPath) {
		const node = this.getNodeByPath(path);
		return Array.from(node.children.values());
	}
}
