import Emitter from './Emitter';
import Method from './Method';
import Request from './Request';
import Response from './Response';

type ResponseCallback = (params: unknown) => void;

export default class Connection extends Emitter {
	private socket: WebSocket;

	private requestTimeout?: number;

	private requestId = 1;

	private pool = new Map<number, ResponseCallback>();

	constructor(socket: WebSocket) {
		super();
		this.socket = socket;
		this.socket.onmessage = (e) => this.handleMessage(e);
	}

	/**
	 * Close the connection.
	 */
	close(): Promise<void> {
		const closed = new Promise<void>((resolve) => {
			this.socket.onclose = () => resolve();
		});
		this.socket.close();
		return closed;
	}

	/**
	 * @return Whether the connection is open.
	 */
	getReadyState(): number {
		return this.socket.readyState;
	}

	/**
	 * Sets maximum time limit for each request.
	 * @param timeout
	 */
	setRequestTimeout(timeout?: number): void {
		this.requestTimeout = timeout;
	}

	/**
	 * @returns Maximum time limit for a request.
	 */
	getRequestTimeout(): number | undefined {
		return this.requestTimeout;
	}

	/**
	 * Get something from the user.
	 * @param context
	 * @param params
	 */
	get(context: number, params?: unknown): Promise<unknown> {
		return this.request(Method.Get, context, params);
	}

	/**
	 * Get meta information of something from the user.
	 * @param context
	 * @param params
	 */
	head(context: number, params?: unknown): Promise<unknown> {
		return this.request(Method.Head, context, params);
	}

	/**
	 * Post changes to the user.
	 * @param context
	 * @param params
	 */
	post(context: number, params?: unknown): Promise<unknown> {
		return this.request(Method.Post, context, params);
	}

	/**
	 * Put something on the user.
	 * @param context
	 * @param params
	 */
	put(context: number, params?: unknown): Promise<unknown> {
		return this.request(Method.Put, context, params);
	}

	/**
	 * Patch something on the user.
	 * @param context
	 * @param params
	 */
	patch(context: number, params?: unknown): Promise<unknown> {
		return this.request(Method.Patch, context, params);
	}

	/**
	 * Delete something from the user.
	 * @param context
	 * @param params
	 */
	delete(context: number, params?: unknown): Promise<unknown> {
		return this.request(Method.Delete, context, params);
	}

	/**
	 * Send a request.
	 * @param context
	 * @param params
	 */
	request(method: Method, context: number, params?: unknown): Promise<unknown> {
		const id = this.requestId++;
		const timeout = this.requestTimeout;
		const req = new Request(id, method, context, {
			params,
			timeout,
		});
		this.socket.send(req.toString());
		return new Promise<unknown>((resolve, reject) => {
			let timer: NodeJS.Timeout;
			this.pool.set(req.id, (res) => {
				if (timer) {
					clearTimeout(timer);
				}
				resolve(res);
			});
			if (timeout && timeout > 0) {
				timer = setTimeout(() => {
					this.pool.delete(req.id);
					reject(new Error(`Time limit exceeded: ${context} is not responded in ${timeout}ms`));
				}, timeout);
			}
		});
	}

	/**
	 * Send a response.
	 * @param id
	 * @param params
	 */
	respond(id: number, params?: unknown): void {
		const res = new Response(id, params);
		this.socket.send(res.toString());
	}

	private handleMessage(e: MessageEvent): void {
		try {
			const packet = JSON.parse(e.data);
			if (!packet.id) {
				return;
			}
			if (packet.context && packet.method) {
				this.handleRequest(packet.id, packet.method, packet.context, packet.params);
				return;
			}
			this.handleResponse(packet.id, packet.params);
		} catch (error) {
			// Ignore
		}
	}

	private handleRequest(id: number, method: Method, context: number, params?: unknown): void {
		try {
			this.emit(method, context, params);
		} catch (error) {
			this.respond(id, String(error));
		}
	}

	private handleResponse(id: number, params?: unknown): void {
		const callback = this.pool.get(id);
		if (!callback) {
			return;
		}

		this.pool.delete(id);
		setTimeout(callback, 0, params);
	}
}
