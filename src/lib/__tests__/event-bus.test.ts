import { describe, expect, it, jest } from "@jest/globals";

import { EventBus } from "../event-bus";

describe("event-bus", () => {
	it("should process base workflow correctly", () => {
		const eventBus = new EventBus<{ a: []; b: [string] }>();
		const listenerA1 = jest.fn();
		const listenerA2 = jest.fn();
		const listenerB1 = jest.fn();
		const listenerB2 = jest.fn();

		const disposeA1 = eventBus.on("a", listenerA1);
		const disposeA2 = eventBus.on("a", listenerA2);
		const disposeB1 = eventBus.on("b", listenerB1);
		const disposeB2 = eventBus.on("b", listenerB2);

		eventBus.dispatch("a");
		eventBus.dispatch("b", "one");

		disposeA1();
		disposeA1();

		eventBus.dispatch("a");
		eventBus.dispatch("b", "two");

		disposeA2();
		disposeB1();

		eventBus.dispatch("a");
		eventBus.dispatch("b", "three");

		disposeB2();

		expect(listenerA1.mock.calls).toEqual([[]]);
		expect(listenerA2.mock.calls).toEqual([[], []]);
		expect(listenerB1.mock.calls).toEqual([["one"], ["two"]]);
		expect(listenerB2.mock.calls).toEqual([["one"], ["two"], ["three"]]);
	});
});
