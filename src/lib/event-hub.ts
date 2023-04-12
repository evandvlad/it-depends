import { EventName, EventData, EventListener } from "../values";

export class EventHub {
	#listeners = new Map<EventName, Array<EventListener<EventName>>>();

	on = <T extends EventName>(name: T, listener: EventListener<T>) => {
		const listeners = this.#listeners.get(name) ?? [];
		listeners.push(listener as EventListener<EventName>);
		this.#listeners.set(name, listeners);
	};

	send = <T extends EventName>(name: T, data: EventData[T]) => {
		(this.#listeners.get(name) ?? []).forEach((listener) => {
			listener(data);
		});
	};
}
