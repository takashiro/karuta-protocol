import NodeWebSocket from 'ws';

import Socket from '../src/Socket';
import W3cWebSocket from './mock/WebSocket';

jest.mock('ws');
jest.mock('./mock/WebSocket');

function fake(ws: Socket): void {
	expect(ws).toBeTruthy();
}

it('should be compatible with W3C WebSocket', () => {
	const ws = new W3cWebSocket();
	fake(ws);
});

it('should be compatible with Node.js WebSocket', () => {
	const ws = new NodeWebSocket(null);
	fake(ws);
});
