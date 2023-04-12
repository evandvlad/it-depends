import { describe, it, expect } from "@jest/globals";

import { parseCode } from "..";

describe("parser", () => {
	const defaultInfo = {
		language: "typescript",
		allowedJSXSyntax: false,
		path: "C:/dir/file.ts",
	} as const;

	describe("empty values", () => {
		it.each([
			{
				name: "empty code",
				code: "",
			},
			{
				name: "code without imports/exports",
				code: `
					window.foo = function() { return "bar"; };
				`,
			},
			{
				name: "commonjs style",
				code: `
					const foo = require("bar");
					exports.baz = foo;
				`,
			},
			{
				name: "entries in comments",
				code: `
					// import foo from "bar";
					/*
					 * import baz from "qux";
					 */
				`,
			},
			{
				name: "entries in quoted strings",
				code: `
					const foo = "import baz from 'qux'";
					const quux = 'import corge from "grault"';
				`,
			},
			{
				name: "entries in backticks",
				code: "const foo = `import bar from 'baz';`",
			},
		])("$name", ({ code }) => {
			const result = parseCode({
				code,
				info: {
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
				name: "side effect import",
				code: `import "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: [],
					},
				],
			},
			{
				name: "empty import",
				code: `import {} from "bar";`,
				result: [
					{
						type: "standard-import",
						source: "bar",
						values: [],
					},
				],
			},
			{
				name: "default import",
				code: `import foo from "baz";`,
				result: [
					{
						type: "standard-import",
						source: "baz",
						values: ["default"],
					},
				],
			},
			{
				name: "default import of type",
				code: `import type foo from "baz";`,
				result: [
					{
						type: "standard-import",
						source: "baz",
						values: ["default"],
					},
				],
			},
			{
				name: "named import",
				code: `import { bar, qux as quux, "corge" as grault } from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["bar", "qux", "corge"],
					},
				],
			},
			{
				name: "named import of types",
				code: `import { type bar, type qux as quux } from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["bar", "qux"],
					},
				],
			},
			{
				name: "namespace import",
				code: `import * as bar from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["*"],
					},
				],
			},
			{
				name: "mixed import (default & named)",
				code: `import bar, { baz, default as qux, quux as corge } from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["default", "baz", "quux"],
					},
				],
			},
			{
				name: "mixed import (default & namespace)",
				code: `import bar, * as baz from "foo";`,
				result: [
					{
						type: "standard-import",
						source: "foo",
						values: ["*"],
					},
				],
			},
		])("$name", ({ code, result }) => {
			expect(parseCode({ code, info: defaultInfo })).toEqual(result);
		});
	});

	describe("dynamic imports", () => {
		it.each([
			{
				name: "import on root level",
				code: `import("foo");`,
				result: [
					{
						type: "dynamic-import",
						source: "foo",
					},
				],
			},
			{
				name: "import on not root level",
				code: `
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
				name: "source is null for not literal value",
				code: `import(true ? "foo" : "bar");`,
				result: [
					{
						type: "dynamic-import",
						source: null,
					},
				],
			},
		])("$name", ({ code, result }) => {
			expect(parseCode({ code, info: defaultInfo })).toEqual(result);
		});
	});

	describe("re-exports", () => {
		it.each([
			{
				name: "full re-export",
				code: `export * from "foo";`,
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
				name: "namespace re-export",
				code: `export * as bar from "foo";`,
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
				name: "named re-export",
				code: `export { default, bar, baz as qux } from "foo";`,
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
				name: "named re-export of types (all)",
				code: `export type { default, bar, baz as qux } from "foo";`,
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
				name: "named re-export of types (separated)",
				code: `export { type Bar, type Baz as Qux } from "foo";`,
				result: [
					{
						type: "re-export",
						source: "foo",
						inputValues: ["Bar", "Baz"],
						outputValues: ["Bar", "Qux"],
					},
				],
			},
		])("$name", ({ code, result }) => {
			expect(parseCode({ code, info: defaultInfo })).toEqual(result);
		});
	});

	describe("exports", () => {
		it.each([
			{
				name: "default export of function",
				code: `export default function Foo() {}`,
				result: [
					{
						type: "standard-export",
						values: ["default"],
					},
				],
			},
			{
				name: "default export of generator",
				code: `export default function* foo() {}`,
				result: [
					{
						type: "standard-export",
						values: ["default"],
					},
				],
			},
			{
				name: "default export of class",
				code: `export default class Foo {}`,
				result: [
					{
						type: "standard-export",
						values: ["default"],
					},
				],
			},
			{
				name: "default export of expression",
				code: `export default new Foo();`,
				result: [
					{
						type: "standard-export",
						values: ["default"],
					},
				],
			},
			{
				name: "export list",
				code: `
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
				name: "export list of types (all)",
				code: `
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
				name: "export list of types (separated)",
				code: `
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
				name: "named export of defined variable",
				code: `export const foo = "bar";`,
				result: [
					{
						type: "standard-export",
						values: ["foo"],
					},
				],
			},
			{
				name: "named export of defined variables",
				code: `export const foo = 1, bar = 2;`,
				result: [
					{
						type: "standard-export",
						values: ["foo", "bar"],
					},
				],
			},
			{
				name: "named export of undefined variables",
				code: `export let foo, bar;`,
				result: [
					{
						type: "standard-export",
						values: ["foo", "bar"],
					},
				],
			},
			{
				name: "named export of object with destructuring assignment",
				code: `export const { bar, baz: qux, quux = true } = foo;`,
				result: [
					{
						type: "standard-export",
						values: ["bar", "qux", "quux"],
					},
				],
			},
			{
				name: "named export of object with destructuring assignment & rest element",
				code: `export const { bar, ...baz } = foo;`,
				result: [
					{
						type: "standard-export",
						values: ["bar", "baz"],
					},
				],
			},
			{
				name: "named export of array with destructuring assignment",
				code: `export const [bar, baz = true] = foo;`,
				result: [
					{
						type: "standard-export",
						values: ["bar", "baz"],
					},
				],
			},
			{
				name: "named export of array with destructuring assignment & rest element",
				code: `export const [bar, ...baz] = foo;`,
				result: [
					{
						type: "standard-export",
						values: ["bar", "baz"],
					},
				],
			},
			{
				name: "named export of array with holes",
				code: `export const [bar,,,baz] = foo;`,
				result: [
					{
						type: "standard-export",
						values: ["bar", "baz"],
					},
				],
			},
			{
				name: "named export of array & object with destructuring assignment",
				code: `export const [{ bar }] = foo;`,
				result: [
					{
						type: "standard-export",
						values: ["bar"],
					},
				],
			},
			{
				name: "named export of function",
				code: `export function foo() {}`,
				result: [
					{
						type: "standard-export",
						values: ["foo"],
					},
				],
			},
			{
				name: "named export of generator",
				code: `export function* foo() {}`,
				result: [
					{
						type: "standard-export",
						values: ["foo"],
					},
				],
			},
			{
				name: "named export of class",
				code: `export class Foo {}`,
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
			{
				name: "named export of complex class",
				code: `export abstract class Foo extends Bar implements IFoo, IBar {}`,
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
			{
				name: "named export of type",
				code: `export type Foo = string;`,
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
			{
				name: "named export of interface",
				code: `export interface Foo {}`,
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
			{
				name: "named export of enum",
				code: `export enum Foo { Bar, Baz }`,
				result: [
					{
						type: "standard-export",
						values: ["Foo"],
					},
				],
			},
		])("$name", ({ code, result }) => {
			expect(parseCode({ code, info: defaultInfo })).toEqual(result);
		});
	});

	describe("multi values", () => {
		it.each([
			{
				name: "only imports",
				code: `
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
				name: "only exports",
				code: `
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
				name: "imports & exports",
				code: `
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
		])("$name", ({ code, result }) => {
			expect(parseCode({ code, info: defaultInfo })).toEqual(result);
		});
	});
});
