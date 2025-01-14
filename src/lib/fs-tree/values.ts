import type { AbsoluteFsPath } from "~/lib/fs-path";
import type { Rec } from "~/lib/rec";

export interface Node {
	parent: Node | null;
	path: AbsoluteFsPath;
	name: string;
	isFile: boolean;
	children: NodesMap;
}

export type NodesMap = Rec<AbsoluteFsPath, Node>;
