export interface MessageEvent {
	data: string;
}

export interface CloseEvent {
	reason: string;
}

interface Socket {
	close(): void;
	send(message: string): void;

	addEventListener(event: 'message', cb: (e: MessageEvent) => void): void;
	addEventListener(event: 'close', cb: (e: CloseEvent) => void): void;

	readyState: number;
}

export default Socket;
