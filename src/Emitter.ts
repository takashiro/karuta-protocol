import ContextListener from './ContextListener';
import Method from './Method';

const methodMap = new Map<Method, string>([
	[Method.Get, 'get'],
	[Method.Post, 'post'],
	[Method.Head, 'head'],
	[Method.Put, 'put'],
	[Method.Patch, 'patch'],
	[Method.Delete, 'delete'],
]);

export default class Emitter {
	private listeners = new Map<number, ContextListener>();

	/**
	 * Register a context listener.
	 * @param listener
	 */
	on(listener: ContextListener): void {
		this.listeners.set(listener.context, listener);
	}

	/**
	 * Unregister a context listener.
	 * @param context
	 */
	off(context: number): void {
		this.listeners.delete(context);
	}

	/**
	 * @return All existing listeners.
	 */
	getListeners(): ContextListener[] {
		return [...this.listeners.values()];
	}

	async emit(method: Method, context: number, params?: unknown): Promise<unknown> {
		const listener = this.listeners.get(context);
		if (!listener) {
			throw new Error('No such a context');
		}

		const func = methodMap.get(method);
		if (!func) {
			throw new Error('Invalid method');
		}

		const callback = Reflect.get(listener, func);
		if (typeof callback !== 'function') {
			throw new Error('Method not supported');
		}

		return callback.call(listener, params);
	}
}
