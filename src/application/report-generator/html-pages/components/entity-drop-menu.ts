import { dropMenu } from "../atoms/drop-menu";

interface Params {
	shortPath: string;
	fullPath: string;
}

export function entityDropMenu({ shortPath, fullPath }: Params) {
	return dropMenu({
		items: [
			{ content: "Open in VS Code", onClick: `app.openInVSCode('${fullPath}');` },
			{ content: "Copy full path", onClick: `app.copyToClipboard('${fullPath}');` },
			{ content: "Copy path", onClick: `app.copyToClipboard('${shortPath}');` },
		],
	});
}
