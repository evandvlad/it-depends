import { assert } from "~/lib/errors";
import { getBreadcrumbs, getName } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import type { Node, NodesMap } from "./values";

export class NodesRegistry {
	readonly rootNode;

	#nodesMap;

	static create(allFilePaths: string[]) {
		assert(allFilePaths.length > 0, "The file paths list is empty. Can't create FSTree with an empty list.");

		function createNode(path: string, parent: Node | null = null): Node {
			return {
				path,
				parent,
				name: getName(path),
				isFile: allFilePaths.includes(path),
				children: new Rec(),
			};
		}

		function attachChildToTree(parent: Node, paths: string[]) {
			if (paths.length === 0) {
				return;
			}

			const [path, ...restPaths] = paths as [string, ...string[]];

			if (!parent.children.has(path)) {
				const node = createNode(path, parent);
				parent.children.set(path, node);
				nodesMap.set(path, node);
			}

			attachChildToTree(parent.children.get(path)!, restPaths);
		}

		const nodesMap: NodesMap = new Rec();
		const path = allFilePaths[0]!;
		const rootPath = getBreadcrumbs(path)[0]!;
		const rootNode = createNode(rootPath);

		nodesMap.set(rootPath, rootNode);

		allFilePaths.forEach((filePath) => {
			const paths = getBreadcrumbs(filePath);
			attachChildToTree(rootNode, paths.slice(1));
		});

		return new this(nodesMap, rootNode);
	}

	private constructor(nodesMap: NodesMap, rootNode: Node) {
		this.#nodesMap = nodesMap;
		this.rootNode = rootNode;
	}

	hasNode(path: string) {
		return this.#nodesMap.has(path);
	}

	getNode(path: string) {
		return this.#nodesMap.get(path);
	}
}
