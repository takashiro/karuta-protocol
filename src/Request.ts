import Method from './Method';

interface RequestOptions {
	params?: unknown;
	timeout?: number;
}

export default class Request {
	readonly id: number;

	readonly method: Method;

	readonly context: number;

	readonly params?: unknown;

	readonly timeout?: number;

	constructor(id: number, method: Method, context: number, options?: RequestOptions) {
		this.id = id;
		this.method = method;
		this.context = context;
		if (options) {
			this.params = options.params;
			this.timeout = options.timeout;
		}
	}

	toString(): string {
		return JSON.stringify({
			id: this.id,
			method: this.method,
			context: this.context,
			params: this.params,
			timeout: this.timeout,
		});
	}
}
