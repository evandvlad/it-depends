import type { AbsoluteFsPath } from "../../../../lib/fs-path";
import type { ComponentContext } from "../../values";
import { a } from "../atoms/a";

interface Params {
	path: AbsoluteFsPath;
}

export function moduleLink({ path }: Params, { pathInformer, fsNavCursor }: ComponentContext) {
	const text = fsNavCursor.getShortPathByPath(path);
	const href = pathInformer.getModuleHtmlPagePathByRealPath(path);

	return a({ text, href });
}
