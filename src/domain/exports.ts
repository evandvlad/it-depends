import { Rec } from "~/lib/rec";

interface Params {
	sourcePath: string;
}

export class Exports {
	readonly sourcePath;

	#pathsByValue = new Rec<string, string[]>();

	constructor({ sourcePath }: Params) {
		this.sourcePath = sourcePath;
	}

	get values() {
		return this.#pathsByValue.toKeys();
	}

	isValueDefined(value: string) {
		return this.#pathsByValue.has(value);
	}

	defineValue(value: string) {
		this.defineValues([value]);
	}

	defineValues(values: string[]) {
		values.forEach((value) => {
			if (!this.#pathsByValue.has(value)) {
				this.#pathsByValue.set(value, []);
			}
		});
	}

	attachPathToValue(value: string, path: string) {
		if (!this.isValueDefined(value)) {
			return;
		}

		const paths = this.#pathsByValue.get(value);

		if (paths.includes(path)) {
			return;
		}

		paths.push(path);
	}

	getPathsByValue(value: string) {
		return this.#pathsByValue.getOrDefault(value, []);
	}
}
