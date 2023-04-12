import { describe, it, expect } from "@jest/globals";

import { AppError, assert, assertNever } from "../errors";

describe("errors", () => {
	describe("ModuleError", () => {
		const e = new AppError("Error");

		it("instanceof from ModuleError is working correctly", () => {
			expect(e instanceof AppError).toEqual(true);
		});

		it("instanceof from Error is working correctly", () => {
			expect(e instanceof Error).toEqual(true);
		});
	});

	describe("assert", () => {
		it("throw error on false condition", () => {
			expect(() => {
				assert(false, "foo");
			}).toThrow(new AppError("foo"));
		});

		it("not throw error on true condition", () => {
			expect(() => {
				assert(true, "bar");
			}).not.toThrow(new AppError("bar"));
		});
	});

	describe("assertNever", () => {
		it("throw error", () => {
			expect(() => {
				assertNever("foo" as never);
			}).toThrow(new Error('Value: "foo" has never type'));
		});
	});
});
