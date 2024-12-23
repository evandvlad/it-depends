export class AppError extends Error {
	constructor(message: string, options?: { cause: Error }) {
		super(message, options);

		this.name = this.constructor.name;

		Error.captureStackTrace(this, this.constructor);
	}
}

export function assert(condition: boolean, message: string): asserts condition {
	if (!condition) {
		throw new AppError(message);
	}
}

export function assertNever(value: never): never {
	throw new Error(`Value: "${value}" has never type`);
}
