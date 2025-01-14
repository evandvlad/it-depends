import { assert } from "~/lib/errors";
import { type AbsoluteFsPath, getBreadcrumbs, getName } from "~/lib/fs-path";
import { Rec } from "~/lib/rec";
import type { Node, NodesMap } from "./values";

export class NodesRegistry {
	readonly rootNode;

	#nodesMap;

	static create(allFilePaths: AbsoluteFsPath[]) {
		assert(allFilePaths.length > 0, "File paths list is empty");

		function createNode(path: AbsoluteFsPath, parent: Node | null = null): Node {
			return {
				path,
				parent,
				name: getName(path),
				isFile: allFilePaths.includes(path),
				children: new Rec(),
			};
		}

		function attachChildToTree(parent: Node, paths: AbsoluteFsPath[]) {
			if (paths.length === 0) {
				return;
			}

			const [path, ...restPaths] = paths as [AbsoluteFsPath, ...AbsoluteFsPath[]];

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

	hasNode(path: AbsoluteFsPath) {
		return this.#nodesMap.has(path);
	}

	getNode(path: AbsoluteFsPath) {
		return this.#nodesMap.get(path);
	}
}
