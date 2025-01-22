import { describe, expect, it } from "@jest/globals";
import { ProgramFileProcessor } from "..";

describe("program-file-processor", () => {
	describe("empty values", () => {
		it.each([
			{
				name: "should parse as empty if content is empty",
				content: "",
			},
			{
				name: "should parse as empty if code without imports/exports",
				content: `
					window.foo = function() { return "bar"; };
				`,
			},
			{
				name: "should parse as empty for commonjs style",
				content: `
					const foo = require("bar");
					exports.baz = foo;
				`,
			},
			{
				name: "should parse as empty if entries in comments",
				content: `
					// import foo from "bar";
					/*
					 * import baz from "qux";
					 */
				`,
			},
			{
				name: "should parse as empty if entries in quoted strings",
				content: `
					const foo = "import baz from 'qux'";
					const quux = 'import corge from "grault"';
				`,
			},
			{
				name: "should parse as empty if entries in backticks",
				content: "const foo = `import bar from 'baz';`",
			},
		])("$name", ({ content }) => {
			const processor = new ProgramFileProcessor();

			const result = processor.process({
				content,
				programFileDetails: {
					language: "javascript",
					allowedJSXSyntax: false,
				},
			});

			expect(result).toEqual([]);
		});
	});

	describe("standard imports", () => {
		it.each([
			{
				name: "should parse side effect import",
				content: `import "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: [],
					},
				],
			},
			{
				name: "should parse empty import",
				content: `import {} from "bar";`,
				result: [
					{
						type: "standard-import",
						source: "bar",
						values: [],
					},
				],
			},
			{
				name: "should parse default import",
				content: `import foo from "baz";`,
				result: [
					{
						type: "standard-import",
						source: "baz",
						values: ["default"],
					},
				],
			},
			{
				name: "should parse default import of type",
				content: `import type foo from "baz";`,
				result: [
					{
						type: "standard-import",
						source: "baz",
						values: ["default"],
					},
				],
			},
			{
				name: "should parse named import",
				content: `import { bar, qux as quux, "corge" as grault } from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["bar", "qux", "corge"],
					},
				],
			},
			{
				name: "should parse named import of types",
				content: `import { type bar, type qux as quux } from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["bar", "qux"],
					},
				],
			},
			{
				name: "should parse namespace import",
				content: `import * as bar from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["*"],
					},
				],
			},
			{
				name: "should parse mixed import (default & named)",
				content: `import bar, { baz, default as qux, quux as corge } from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["default", "baz", "quux"],
					},
				],
			},
			{
				name: "should parse mixed import (default & namespace)",
				content: `import bar, * as baz from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["*"],
					},
				],
			},
		])("$name", ({ content, result }) => {
			const processor = new ProgramFileProcessor();

			expect(
				processor.process({ content, programFileDetails: { language: "typescript", allowedJSXSyntax: false } }),
			).toEqual(result);
		});
	});

	describe("dynamic imports", () => {
		it.each([
			{
				name: "should parse import on root level",
				content: `import("foo");`,
				result: [
					{
						type: "dynamic-import",
						source: "foo",
					},
				],
			},
			{
				name: "should parse import on sublevel",
				content: `
					async function foo() {
						return await import("foo").catch(() => ({}));
					}
				`,
				result: [
					{
						type: "dynamic-import",
						source: "foo",
					},
				],
			},
			{
				name: "should parse with nullable source for no literal value",
				content: `import(true ? "foo" : "bar");`,
				result: [
					{
						type: "dynamic-import",
						source: null,
					},
				],
			},
		])("$name", ({ content, result }) => {
			const processor = new ProgramFileProcessor();

			expect(
				processor.process({ content, programFileDetails: { language: "typescript", allowedJSXSyntax: false } }),
			).toEqual(result);
		});
	});

	describe("re-exports", () => {
		it.each([
			{
				name: "should parse full re-export",
				content: `export * from "foo";`,
				result: [
					{
						type: "re-export",
						source: "foo",
						inputValues: ["*"],
						outputValues: ["*"],
					},
				],
			},
			{
				name: "should parse namespace re-export",
				content: `export * as bar from "foo";`,
				result: [
					{
						type: "re-export",
						source: "foo",
						inputValues: ["*"],
						outputValues: ["bar"],
					},
				],
			},
			{
				name: "should parse named re-export",
				content: `export { default, bar, baz as qux } from "foo";`,
				result: [
					{
						type: "re-export",
						source: "foo",
						inputValues: ["default", "bar", "baz"],
						outputValues: ["default", "bar", "qux"],
					},
				],
			},
			{
				name: "should parse named re-export of types (all)",
				content: `export type { default, bar, baz as qux } from "foo";`,
				result: [
					{
						type: "re-export",
						source: "foo",
						inputValues: ["default", "bar", "baz"],
						outputValues: ["default", "bar", "qux"],
					},
				],
			},
			{
				name: "should parse named re-export of types (separated)",
				content: `export { type Bar, type Baz as Qux } from "foo";`,
				result: [
					{
						type: "re-export",
						source: "foo",
						inputValues: ["Bar", "Baz"],
						outputValues: ["Bar", "Qux"],
					},
				],
			},
		])("$name", ({ content, result }) => {
			const processor = new ProgramFileProcessor();

			expect(
				processor.process({ content, programFileDetails: { language: "typescript", allowedJSXSyntax: false } }),
			).toEqual(result);
		});
	});

	describe("exports", () => {
		it.each([
			{
				name: "should parse default export of function",
				content: "export default function Foo() {}",
				result: [
					{
						type: "standard-export",
						values: ["default"],
					},
				],
			},
			{
				name: "should parse default export of generator",
				content: "export default function* foo() {}",
				result: [
					{
						type: "standard-export",
						values: ["default"],
					},
				],
			},
			{
				name: "should parse default export of class",
				content: "export default class Foo {}",
				result: [
					{
						type: "standard-export",
						values: ["default"],
					},
				],
			},
			{
				name: "should parse default export of expression",
				content: "export default new Foo();",
				result: [
					{
						type: "standard-export",
						values: ["default"],
					},
				],
			},
			{
				name: "should parse export list",
				content: `
					const foo = "foo";
					const bar = "bar";
					const baz = "baz";
					const qux = "qux";
					
					export { foo, bar as Bar, baz as default, qux as "quux" }; 
				`,
				result: [
					{
						type: "standard-export",
						values: ["foo", "Bar", "default", "quux"],
					},
				],
			},
			{
				name: "should parse export list of types (all)",
				content: `
					class Foo {}
					class Bar {}
					
					export type { Foo, Bar as Baz }; 
				`,
				result: [
					{
						type: "standard-export",
						values: ["Foo", "Baz"],
					},
				],
			},
			{
				name: "should parse export list of types (separated)",
				content: `
					class Foo {}
					class Bar {}
					
					export { type Foo, Bar as Baz }; 
				`,
				result: [
					{
						type: "standard-export",
						values: ["Foo", "Baz"],
					},
				],
			},
			{
				name: "should parse named export of defined variable",
				content: `export const foo = "bar";`,
				result: [
					{
						type: "standard-export",
						values: ["foo"],
					},
				],
			},
			{
				name: "should parse named export of defined variables",
				content: "export const foo = 1, bar = 2;",
				result: [
					{
						type: "standard-export",
						values: ["foo", "bar"],
					},
				],
			},
			{
				name: "should parse named export of undefined variables",
				content: "export let foo, bar;",
				result: [
					{
						type: "standard-export",
						values: ["foo", "bar"],
					},
				],
			},
			{
				name: "should parse named export of object with destructuring assignment",
				content: "export const { bar, baz: qux, quux = true } = foo;",
				result: [
					{
						type: "standard-export",
						values: ["bar", "qux", "quux"],
					},
				],
			},
			{
				name: "should parse named export of object with destructuring assignment & rest element",
				content: "export const { bar, ...baz } = foo;",
				result: [
					{
						type: "standard-export",
						values: ["bar", "baz"],
					},
				],
			},
			{
				name: "should parse named export of array with destructuring assignment",
				content: "export const [bar, baz = true] = foo;",
				result: [
					{
						type: "standard-export",
						values: ["bar", "baz"],
					},
				],
			},
			{
				name: "should parse named export of array with destructuring assignment & rest element",
				content: "export const [bar, ...baz] = foo;",
				result: [
					{
						type: "standard-export",
						values: ["bar", "baz"],
					},
				],
			},
			{
				name: "should parse named export of array with holes",
				content: "export const [bar,,,baz] = foo;",
				result: [
					{
						type: "standard-export",
						values: ["bar", "baz"],
					},
				],
			},
			{
				name: "should parse named export of array & object with destructuring assignment",
				content: "export const [{ bar }] = foo;",
				result: [
					{
						type: "standard-export",
						values: ["bar"],
					},
				],
			},
			{
				name: "should parse named export of function",
				content: "export function foo() {}",
				result: [
					{
						type: "standard-export",
						values: ["foo"],
					},
				],
			},
			{
				name: "should parse named export of generator",
				content: "export function* foo() {}",
				result: [
					{
						type: "standard-export",
						values: ["foo"],
					},
				],
			},
			{
				name: "should parse named export of class",
				content: "export class Foo {}",
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
			{
				name: "should parse named export of complex class",
				content: "export abstract class Foo extends Bar implements IFoo, IBar {}",
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
			{
				name: "should parse named export of type",
				content: "export type Foo = string;",
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
			{
				name: "should parse named export of interface",
				content: "export interface Foo {}",
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
			{
				name: "should parse named export of enum",
				content: "export enum Foo { Bar, Baz }",
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
		])("$name", ({ content, result }) => {
			const processor = new ProgramFileProcessor();

			expect(
				processor.process({ content, programFileDetails: { language: "typescript", allowedJSXSyntax: false } }),
			).toEqual(result);
		});
	});

	describe("multi values", () => {
		it.each([
			{
				name: "should parse multi imports",
				content: `
					import foo from "bar";
					import * as baz from "qux";
					import { baz as quux } from "corge";

					const waldo = "waldo";
					const grault = await Promise.all([
						import("garply"),
						import(waldo),
					]);
				`,
				result: [
					{ type: "standard-import", source: "bar", values: ["default"] },
					{ type: "standard-import", source: "qux", values: ["*"] },
					{ type: "standard-import", source: "corge", values: ["baz"] },
					{ type: "dynamic-import", source: "garply" },
					{ type: "dynamic-import", source: null },
				],
			},
			{
				name: "should parse multi exports",
				content: `
					const bar = ["foo", "bar"];
					const baz = { foo: "foo", bar: "bar" };

					export default function Foo() {}
					export const qux = "qux";
					export * as quux from "quux";

					export const [bar1, bar2] = bar;
					export const { foo, bar: bar3 } = baz;
				`,
				result: [
					{ type: "standard-export", values: ["default"] },
					{ type: "standard-export", values: ["qux"] },
					{ type: "re-export", source: "quux", inputValues: ["*"], outputValues: ["quux"] },
					{ type: "standard-export", values: ["bar1", "bar2"] },
					{ type: "standard-export", values: ["foo", "bar3"] },
				],
			},
			{
				name: "should parse multi imports & exports",
				content: `
					import "foo";
					import { foo as Foo, bar, type baz as Baz } from "bar";

					class Qux {}

					export { Foo, Baz };
					export const qux = new Qux();
				`,
				result: [
					{ type: "standard-import", source: "foo", values: [] },
					{ type: "standard-import", source: "bar", values: ["foo", "bar", "baz"] },
					{ type: "standard-export", values: ["Foo", "Baz"] },
					{ type: "standard-export", values: ["qux"] },
				],
			},
		])("$name", ({ content, result }) => {
			const processor = new ProgramFileProcessor();

			expect(
				processor.process({ content, programFileDetails: { language: "typescript", allowedJSXSyntax: false } }),
			).toEqual(result);
		});
	});
});
