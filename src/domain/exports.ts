import type { Rec } from "~/lib/rec";

interface Params {
	data: Rec<string, string[]>;
}

export class Exports {
	#pathsByValue;

	constructor({ data }: Params) {
		this.#pathsByValue = data;
	}

	get values() {
		return this.#pathsByValue.toKeys();
	}

	getPathsByValue(value: string) {
		return this.#pathsByValue.getOrDefault(value, []);
	}
}
