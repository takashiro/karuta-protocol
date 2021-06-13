export default class Response {
	readonly id: number;

	readonly params?: unknown;

	constructor(id: number, params?: unknown) {
		this.id = id;
		this.params = params;
	}

	toString(): string {
		return JSON.stringify({
			id: this.id,
			params: this.params,
		});
	}
}
