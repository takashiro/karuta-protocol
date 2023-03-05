import Method from './Method';

interface NotificationOptions {
	params?: unknown;
}

export default class Request {
	readonly method: Method;

	readonly context: number;

	readonly params?: unknown;

	constructor(method: Method, context: number, options?: NotificationOptions) {
		this.method = method;
		this.context = context;
		if (options) {
			this.params = options.params;
		}
	}

	toString(): string {
		return JSON.stringify({
			method: this.method,
			context: this.context,
			params: this.params,
		});
	}
}
