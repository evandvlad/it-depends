export interface LinkData {
	url: string;
	content: string;
}

export interface LinkTreeItem {
	name: string;
	linkData: LinkData | null;
}

export interface LinkTreeNode<T> {
	content: T;
	children: LinkTreeNode<T>[];
}
