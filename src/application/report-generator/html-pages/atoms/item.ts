import { type DataAttrs, spreadDataAttrs } from "../helpers/data-attrs";

interface Params {
	mainContent: string;
	extraContent?: string;
	dataAttrs?: DataAttrs;
}

export function item({ mainContent, extraContent, dataAttrs }: Params) {
	return `
		<div class="item" ${spreadDataAttrs(dataAttrs)}>
			<div>${mainContent}</div>
			${extraContent ? `<div>${extraContent}</div>` : ""}
		</div>
	`;
}
