import { describe, expect, it } from "@jest/globals";
import { createId } from "../id";

describe("id", () => {
	it("should get uniq values", () => {
		const values = new Array(1000).fill("").map(() => createId());
		expect(values.length).toEqual(new Set(values).size);
	});
});
