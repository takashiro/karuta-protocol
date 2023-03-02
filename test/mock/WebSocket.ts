export default class MockedWebSocket implements WebSocket {
	binaryType: BinaryType = 'blob';

	bufferedAmount = 0;

	extensions = '';

	onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;

	onerror: ((this: WebSocket, ev: Event) => any) | null = null;

	onmessage: ((this: WebSocket, ev: MessageEvent<any>) => any) | null = null;

	onopen: ((this: WebSocket, ev: Event) => any) | null = null;

	protocol = '';

	readyState = 0;

	url = '';

	close(code?: number | undefined, reason?: string | undefined): void {
		throw new Error('Method not implemented.');
	}

	send(data: string | ArrayBufferView | ArrayBufferLike | Blob): void {
		throw new Error('Method not implemented.');
	}

	CLOSED = 0;

	CLOSING = 1;

	CONNECTING = 2;

	OPEN = 3;

	addEventListener(type: unknown, listener: unknown, options?: unknown): void {
		throw new Error('Method not implemented.');
	}

	removeEventListener(type: unknown, listener: unknown, options?: unknown): void {
		throw new Error('Method not implemented.');
	}

	dispatchEvent(event: Event): boolean {
		throw new Error('Method not implemented.');
	}
}
