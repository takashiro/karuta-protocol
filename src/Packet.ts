import Method from './Method';

export default class Packet {
	readonly method: Method;

	readonly context: number;

	readonly params?: unknown;

	/**
	 * Construct a network packet
	 * @param method
	 * @param context
	 * @param params
	 */
	constructor(method: Method, context: number, params?: unknown) {
		this.method = method;
		this.context = context;
		this.params = params;
	}

	/**
	 * Convert a network packet into JSON string representation
	 */
	toJSON(): string {
		return JSON.stringify({
			method: this.method,
			context: this.context,
			params: this.params,
		});
	}

	static parse(data: string): Packet {
		const { method, context, params } = JSON.parse(data);
		return new Packet(method, context, params);
	}
}
