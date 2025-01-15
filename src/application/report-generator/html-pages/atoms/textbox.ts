interface Params {
	onInput: string;
	placeholder?: string;
}

export function textbox({ onInput, placeholder = "" }: Params) {
	return `<input class="textbox" type="text" placeholder="${placeholder}" onInput="${onInput}" />`;
}
