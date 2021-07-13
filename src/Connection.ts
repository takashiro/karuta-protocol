import Emitter from './Emitter';
import Method from './Method';
import Request from './Request';
import Response from './Response';
import Socket, { MessageEvent, SocketState } from './Socket';

type ResponseCallback = (params: unknown) => void;

export default class Connection extends Emitter {
	private socket: Socket;

	private requestTimeout?: number;

	private requestId = 1;

	private pool = new Map<number, ResponseCallback>();

	constructor(socket: Socket) {
		super();
		this.socket = socket;
		this.socket.addEventListener('message', (e) => this.handleMessage(e));
	}

	/**
	 * Wait until the connection is opened.
	 */
	open(): Promise<void> {
		if (this.socket.readyState === SocketState.OPEN) {
			return Promise.resolve();
		}
		return new Promise((resolve) => {
			this.socket.addEventListener('open', resolve, { once: true });
		});
	}

	/**
	 * Close the connection.
	 */
	close(): Promise<void> {
		if (this.socket.readyState === SocketState.CLOSED) {
			return Promise.resolve();
		}

		const closed = new Promise<void>((resolve) => {
			this.socket.addEventListener('close', () => resolve(), { once: true });
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
	 * Send a request
	 * @param method
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
	 * Send a notification.
	 * @param method
	 * @param context
	 * @param params
	 */
	notify(method: Method, context: number, params?: unknown): void {
		const req = new Request(0, method, context, {
			params,
		});
		this.socket.send(req.toString());
	}

	/**
	 * Send a response.
	 * @param id
	 * @param params
	 */
	private respond(id: number, params?: unknown): void {
		const res = new Response(id, params);
		this.socket.send(res.toString());
	}

	private handleMessage(e: MessageEvent): void {
		try {
			const packet = JSON.parse(e.data);
			if (packet.context && packet.method) {
				if (packet.id) {
					this.handleRequest(packet.id, packet.method, packet.context, packet.params);
				} else {
					this.handleNotification(packet.method, packet.context, packet.params);
				}
			} else if (packet.id) {
				this.handleResponse(packet.id, packet.params);
			}
		} catch (error) {
			// Ignore
		}
	}

	private async handleRequest(
		id: number,
		method: Method,
		context: number,
		params?: unknown,
	): Promise<void> {
		try {
			const res = await this.emit(method, context, params);
			this.respond(id, res);
		} catch (error) {
			this.respond(id, {
				error: String(error),
			});
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

	private async handleNotification(
		method: Method,
		context: number,
		params?: unknown,
	): Promise<void> {
		try {
			await this.emit(method, context, params);
		} catch (error) {
			// Ignore
		}
	}
}
