import { encodeHTML } from "../../../../lib/code-encoder";
import type { ModulePageViewModel } from "../../page-view-models";

function moduleCodeLine({ num, line }: { num: number; line: string }) {
	return `
		<div class="module-code__line">
			<span class="module-code__line-gutter">${num}</span>
			<span class="module-code__line-code">${encodeHTML(line)}</span>
		</div>
	`;
}

export function moduleCode(pageViewModel: ModulePageViewModel) {
	const code = pageViewModel.code
		.split("\n")
		.map((line, i) => moduleCodeLine({ num: i + 1, line }))
		.join("");

	return `
		<div class="module-code">
			<div class="module-code__content">${code}</div>
		</div>
	`;
}
