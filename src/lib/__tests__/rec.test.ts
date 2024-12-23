import { describe, expect, it, jest } from "@jest/globals";
import { AppError } from "../errors";
import { Rec } from "../rec";

describe("rec", () => {
	it("should be error if value with key wasn't found in rec", () => {
		const rec = new Rec();

		expect(() => {
			rec.get("key");
		}).toThrow(new AppError(`Value by key "key" wasn't found in rec`));
	});

	it("should perform basic operation correctly", () => {
		const rec = Rec.fromObject<string, number>({ a: 1, b: 2 });

		rec.set("c", 3);

		expect(rec.has("a")).toEqual(true);
		expect(rec.has("d")).toEqual(false);
		expect(rec.get("a")).toEqual(1);
		expect(rec.get("c")).toEqual(3);

		expect(rec.size).toEqual(3);
		expect(rec.toKeys()).toEqual(["a", "b", "c"]);
		expect(rec.toValues()).toEqual([1, 2, 3]);
		expect(rec.toEntries()).toEqual([
			["a", 1],
			["b", 2],
			["c", 3],
		]);
	});

	it("should create rec from entries", () => {
		const rec = new Rec();

		rec.set("a", 1);
		rec.set("b", 2);

		expect(Rec.fromEntries(rec.toEntries())).toEqual(rec);
	});

	it("should create rec from object", () => {
		const rec = new Rec();

		rec.set(1, "a");
		rec.set(2, "b");

		expect(Rec.fromObject(Object.fromEntries(rec.toEntries()))).toEqual(rec);
	});

	it("should iterate items correctly", () => {
		const fn = jest.fn();
		const rec = Rec.fromObject<string, number>({ a: 1, b: 2 });

		rec.forEach(fn);

		expect(fn.mock.calls).toEqual([
			[1, "a"],
			[2, "b"],
		]);
	});

	it("should map value correctly", () => {
		const rec1 = Rec.fromObject<string, number>({ a: 1, b: 2 });
		const rec2 = rec1.mapValue((value, key) => `${key}:${value}`);

		expect(rec2.toEntries()).toEqual([
			["a", "a:1"],
			["b", "b:2"],
		]);
	});

	it("should reduce values correctly", () => {
		const value = Rec.fromObject<string, number>({ a: 1, b: 2 }).reduce(
			(acc, value, key) => `${acc}${key}:${value},`,
			"",
		);

		expect(value).toEqual("a:1,b:2,");
	});
});
