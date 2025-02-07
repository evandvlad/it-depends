import type { Rec } from "~/lib/rec";

export interface Node {
	parent: Node | null;
	path: string;
	name: string;
	isFile: boolean;
	children: NodesMap;
}

export type NodesMap = Rec<string, Node>;
