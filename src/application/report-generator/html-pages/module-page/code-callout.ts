import { encodeHTML } from "../../../../lib/code-encoder";
import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { code } from "../atoms/code";
import { frame } from "../atoms/frame";

interface Params {
	path: AbsoluteFsPath;
}

export function codeCallout({ path }: Params, { modules }: ComponentContext) {
	const { content } = modules.get(path);

	return frame({
		content: code({ content: encodeHTML(content) }),
	});
}
