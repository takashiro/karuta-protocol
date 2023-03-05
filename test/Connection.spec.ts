import { randomInt } from 'crypto';
import WebSocket, { WebSocketServer } from 'ws';

import { Method, Connection } from '../src';
import idle from './util/idle';

const port = randomInt(10000, 0xFFFF);
const server = new WebSocketServer({ port });

let remoteSocket: WebSocket;
let remote: Connection;
server.on('connection', (ws) => {
	remoteSocket = ws;
	remote = new Connection(ws);
});

const localSocket = new WebSocket(`ws://localhost:${port}`);
const local = new Connection(localSocket);

afterAll(() => {
	server.close();
});

describe('Open connection', () => {
	it('opens a local connection', async () => {
		await local.open();
	});

	it('does nothing if it is already open', async () => {
		const addEventListener = jest.spyOn(localSocket, 'addEventListener');
		await local.open();
		expect(addEventListener).not.toBeCalled();
		addEventListener.mockRestore();
	});
});

describe('Handle requests', () => {
	it('gets a context', async () => {
		const [res] = await Promise.all([
			remote.waitFor(1, 'get'),
			local.get(1, 134),
		]);
		expect(res).toBe(134);
	});

	it('gets a context with parameters', async () => {
		remote.on({
			context: 123,
			get: () => ({ test: 567 }),
		});
		const res = await local.get(123);
		expect(res).toStrictEqual({ test: 567 });
	});

	it('gets head information of a context', async () => {
		const [res] = await Promise.all([
			remote.waitFor(2, 'head'),
			local.head(2, 275),
		]);
		expect(res).toBe(275);
	});

	it('posts to a context', async () => {
		const [res] = await Promise.all([
			remote.waitFor(3, 'post'),
			local.post(3, { seq: 4 }),
		]);
		expect(res).toStrictEqual({ seq: 4 });
	});

	it('posts to a context with parameters', async () => {
		remote.on({
			context: 333,
			post: () => ({ ack: 345 }),
		});
		const res = await local.post(333, { seq: 344 });
		expect(res).toStrictEqual({ ack: 345 });
	});

	it('puts a context', async () => {
		const [res] = await Promise.all([
			remote.waitFor(5, 'put'),
			local.put(5, { seq: 6 }),
		]);
		expect(res).toStrictEqual({ seq: 6 });
	});

	it('deletes a context', async () => {
		const [res] = await Promise.all([
			remote.waitFor(7, 'delete'),
			local.delete(7),
		]);
		expect(res).toBeUndefined();
	});

	it('patches a context', async () => {
		const [res] = await Promise.all([
			remote.waitFor(8, 'patch'),
			local.patch(8, { seq: 9 }),
		]);
		expect(res).toStrictEqual({ seq: 9 });
	});
});

describe('Handle errors', () => {
	it('sets request timeout', () => {
		local.setRequestTimeout(10);
		expect(local.getRequestTimeout()).toBe(10);
	});

	it('deletes a context but timeout error occurs', async () => {
		remote.on({
			context: 789,
			delete() {
				return idle(20);
			},
		});
		await expect(() => local.delete(789)).rejects.toThrowError('Time limit exceeded: 789 is not responded in 10ms');
	});

	it('clears timeout if resolved', async () => {
		const del = jest.fn();
		remote.on({ context: 7, delete: del });
		await local.delete(7);
		expect(del).toBeCalled();
	});

	it('ignores invalid message', async () => {
		remoteSocket.send(Buffer.alloc(8));
		localSocket.send(JSON.stringify({ context: 0, id: 0 }));
		localSocket.send(JSON.stringify({ context: 0 }));
		localSocket.send(JSON.stringify({ id: 0 }));
	});

	it('replies with error', async () => {
		remote.on({
			context: 466,
			get() {
				throw new Error('invalid');
			},
		});
		const res = await local.get(466) as { error: string };
		expect(res.error).toBe('Error: invalid');
	});
});

describe('Handle notification', () => {
	it('sends a notification', async () => {
		const [res] = await Promise.all([
			local.waitFor(536, 'delete'),
			remote.notify(Method.Delete, 536, 505),
		]);
		expect(res).toBe(505);
	});
});

describe('Close connection', () => {
	it('closes web socket', async () => {
		await local.close();
	});

	it('does nothing if it is already closed', async () => {
		const addEventListener = jest.spyOn(localSocket, 'addEventListener');
		await local.close();
		expect(addEventListener).not.toBeCalled();
		addEventListener.mockRestore();
	});
});
