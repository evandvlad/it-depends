import { describe, expect, it } from "@jest/globals";
import { assert, AppError, assertNever } from "../errors";

describe("errors", () => {
	describe("ModuleError", () => {
		const e = new AppError("Error");

		it("should be correct instance detection", () => {
			expect(e instanceof AppError).toEqual(true);
			expect(e instanceof Error).toEqual(true);
		});
	});

	describe("assert", () => {
		it("should be thrown error on false condition", () => {
			expect(() => {
				assert(false, "foo");
			}).toThrow(new AppError("foo"));
		});

		it("should not be thrown error on true condition", () => {
			expect(() => {
				assert(true, "bar");
			}).not.toThrow(new AppError("bar"));
		});
	});

	describe("assertNever", () => {
		it("should be thrown error", () => {
			expect(() => {
				assertNever("foo" as never);
			}).toThrow(new Error('Value: "foo" has never type'));
		});
	});
});
