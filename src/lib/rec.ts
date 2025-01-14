import { assert } from "~/lib/errors";

export class Rec<K extends PropertyKey, V> {
	#data: Record<K, V> = Object.create({});

	static fromEntries<K extends PropertyKey, V>(entries: [key: K, value: V][]) {
		return entries.reduce((acc, [key, value]) => {
			acc.set(key, value);
			return acc;
		}, new this<K, V>());
	}

	static fromObject<K extends PropertyKey, V>(object: Record<K, V>) {
		return Object.entries<V>(object).reduce((acc, [key, value]) => {
			acc.set(key as K, value);
			return acc;
		}, new this<K, V>());
	}

	get size() {
		return Object.keys(this.#data).length;
	}

	has(key: K) {
		return Object.hasOwn(this.#data, key);
	}

	set(key: K, value: V) {
		this.#data[key] = value;
	}

	get(key: K) {
		assert(this.has(key), `Value by key '${key.toString()}' wasn't found in the rec instance.`);
		return this.#data[key]!;
	}

	getOrDefault(key: K, defaultValue: V) {
		return this.has(key) ? this.get(key) : defaultValue;
	}

	forEach(callback: (value: V, key: K) => void) {
		this.toEntries().forEach(([key, value]) => {
			callback(value, key);
		});
	}

	mapValue<V2>(callback: (value: V, key: K) => V2) {
		return this.toEntries().reduce((acc, [key, value]) => {
			acc.set(key, callback(value, key));
			return acc;
		}, new Rec<K, V2>());
	}

	reduce<T>(callback: (acc: T, value: V, key: K) => T, value: T) {
		return this.toEntries().reduce((acc, [key, value]) => callback(acc, value, key), value);
	}

	toKeys() {
		return Object.keys(this.#data) as K[];
	}

	toValues() {
		return Object.values(this.#data) as V[];
	}

	toEntries() {
		return Object.entries(this.#data) as [key: K, value: V][];
	}
}
