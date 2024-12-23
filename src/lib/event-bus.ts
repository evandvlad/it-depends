type Listener<T extends unknown[]> = (...args: T) => void;

type Rec = Record<string, unknown[]>;

export interface EventBusDispatcher<T extends Rec> {
	dispatch: <K extends keyof T>(name: K, ...args: T[K]) => void;
}

export interface EventBusSubscriber<T extends Rec> {
	on: <K extends keyof T>(name: K, listener: Listener<T[K]>) => void;
}

export class EventBus<T extends Rec> implements EventBusDispatcher<T>, EventBusSubscriber<T> {
	#listeners: { [U in keyof T]?: Listener<T[U]>[] } = Object.create(null);

	on = <K extends keyof T>(name: K, listener: Listener<T[K]>) => {
		const listeners = this.#listeners[name] ?? [];

		listeners.push(listener);
		this.#listeners[name] = listeners;

		return () => {
			this.#listeners[name] = this.#listeners[name]!.filter((func) => listener !== func);
		};
	};

	dispatch = <K extends keyof T>(name: K, ...args: T[K]) => {
		this.#listeners[name]?.forEach((listener) => {
			listener(...args);
		});
	};
}
