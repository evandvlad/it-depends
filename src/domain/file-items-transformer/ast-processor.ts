import traverse from "@babel/traverse";
import {
	type Identifier,
	type Node,
	type StringLiteral,
	isCallExpression,
	isIdentifier,
	isStringLiteral,
} from "@babel/types";
import { type IEItem, ieValueAll } from "./values";

const defaultValue = "default";

function getValue(node: Identifier | StringLiteral) {
	return node.type === "Identifier" ? node.name : node.value;
}

export function processAST(ast: Node) {
	const items: IEItem[] = [];

	traverse(ast, {
		/*
		 * import foo from "bar"
		 * import * as foo from "bar"
		 * import { foo } from "bar"
		 * import "foo"
		 */
		ImportDeclaration(path) {
			const { node } = path;
			const values = new Set<string>();

			path.traverse({
				ImportDefaultSpecifier() {
					values.add(defaultValue);
				},

				ImportSpecifier({ node }) {
					values.add(getValue(node.imported));
				},

				ImportNamespaceSpecifier() {
					values.add(ieValueAll);
				},
			});

			items.push({
				type: "standard-import",
				source: node.source.value,
				values: values.has(ieValueAll) ? [ieValueAll] : Array.from(values),
			});
		},

		/*
		 *	import("foo")
		 */
		Import({ parent }) {
			if (!isCallExpression(parent)) {
				return;
			}

			const [arg] = parent.arguments;

			items.push({
				type: "dynamic-import",
				source: isStringLiteral(arg) ? arg.value : null,
			});
		},

		/*
		 * export * from "foo"
		 */
		ExportAllDeclaration({ node }) {
			items.push({
				type: "re-export",
				source: node.source.value,
				inputValues: [ieValueAll],
				outputValues: [ieValueAll],
			});
		},

		/*
		 * export * as foo from "bar"
		 * export { foo } from "bar"
		 * export { foo }
		 * export [var/let/const/function/class/enum/type/interface] name ...
		 * export [var/let/const] name1, name2
		 * export [var/let/const] { ... } = object
		 * export [var/let/const] [...] = array
		 */
		ExportNamedDeclaration(path) {
			const { node } = path;
			const outputValues = node.specifiers.map(({ exported }) => getValue(exported));

			if (node.source) {
				const inputValues: string[] = [];

				path.traverse({
					ExportNamespaceSpecifier() {
						inputValues.push(ieValueAll);
					},

					ExportSpecifier({ node }) {
						inputValues.push(node.local.name);
					},
				});

				items.push({
					outputValues,
					type: "re-export",
					source: node.source.value,
					inputValues: inputValues.includes(ieValueAll) ? [ieValueAll] : inputValues,
				});

				return;
			}

			if (node.declaration) {
				if ("id" in node.declaration && node.declaration.id) {
					// export [function/function*/class/enum/type/interface] name ...
					items.push({
						type: "standard-export",
						values: [getValue(node.declaration.id)],
					});

					return;
				}

				const values: string[] = [];

				path.traverse({
					VariableDeclarator(path) {
						const { id } = path.node;

						if (isIdentifier(id)) {
							values.push(id.name);
							return;
						}

						path.traverse({
							ObjectProperty({ node }) {
								if (isIdentifier(node.value)) {
									values.push(node.value.name);
								}
							},

							ArrayPattern({ node }) {
								node.elements
									.filter((element): element is Identifier => isIdentifier(element))
									.forEach((element) => {
										values.push(element.name);
									});
							},

							AssignmentPattern({ node }) {
								if (isIdentifier(node.left)) {
									values.push(node.left.name);
								}
							},

							RestElement({ node }) {
								if (isIdentifier(node.argument)) {
									values.push(node.argument.name);
								}
							},
						});
					},
				});

				items.push({
					values,
					type: "standard-export",
				});

				return;
			}

			// export { foo }
			items.push({
				type: "standard-export",
				values: outputValues,
			});
		},

		/*
		 * export default ...
		 */
		ExportDefaultDeclaration() {
			items.push({
				type: "standard-export",
				values: [defaultValue],
			});
		},
	});

	return items;
}
