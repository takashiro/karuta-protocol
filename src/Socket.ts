export interface MessageEvent {
	data: string;
}

export interface CloseEvent {
	reason: string;
}

interface EventListenerOptions {
	once?: boolean;
}

interface Socket {
	close(): void;
	send(message: string): void;

	addEventListener(event: 'open', cb: () => void, options?: EventListenerOptions): void;
	addEventListener(event: 'message', cb: (e: MessageEvent) => void, options?: EventListenerOptions): void;
	addEventListener(event: 'close', cb: (e: CloseEvent) => void, options?: EventListenerOptions): void;

	readyState: number;
}

export const enum SocketState {
	CONNECTING,
	OPEN,
	CLOSING,
	CLOSED,
}

export default Socket;
