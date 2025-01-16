import { type DataAttrs, spreadDataAttrs } from "../helpers/data-attrs";

interface Params {
	placeholder: string;
	dataAttrs: DataAttrs;
}

export function textbox({ placeholder, dataAttrs }: Params) {
	return `<input class="textbox" type="text" placeholder="${placeholder}" ${spreadDataAttrs(dataAttrs)} />`;
}
