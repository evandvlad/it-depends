export interface LinkData {
	url: string;
	content: string;
}

export interface CountableLinkItem {
	linkData: LinkData;
	num: number;
}

export interface LinkTreeItem {
	name: string;
	linkData: LinkData | null;
}

export interface LinkTreeNode<T> {
	content: T;
	title: string;
	children: LinkTreeNode<T>[];
}
