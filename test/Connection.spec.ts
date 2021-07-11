import Connection from '../src/Connection';
import Method from '../src/Method';

const close = jest.fn();
const send = jest.fn();
const addEventListener = jest.fn();
const ws = {
	send,
	close,
	readyState: 3,
	addEventListener,
} as unknown as WebSocket;
const con = new Connection(ws);

function mockRequest(id: number, method: Method, context: number, params?: unknown): void {
	const listener = addEventListener.mock.calls[0][1];
	listener({
		data: JSON.stringify({
			id,
			method,
			context,
			params,
		}),
	});
}

function mockResponse(params?: unknown): void {
	const id = Reflect.get(con, 'requestId') - 1;
	const listener = addEventListener.mock.calls[0][1];
	listener({
		data: JSON.stringify({
			id,
			params,
		}),
	});
}

afterEach(() => {
	send.mockClear();
});

describe('methods', () => {
	const request = jest.spyOn(con, 'request').mockResolvedValue(1);

	afterEach(() => {
		request.mockClear();
	});

	afterAll(() => {
		request.mockRestore();
	});

	it('gets a context', async () => {
		await con.get(1, 1);
		expect(request).toBeCalledWith(Method.Get, 1, 1);
	});

	it('gets head information of a context', async () => {
		await con.head(2, 2);
		expect(request).toBeCalledWith(Method.Head, 2, 2);
	});

	it('posts to a context', async () => {
		await con.post(3, { seq: 4 });
		expect(request).toBeCalledWith(Method.Post, 3, { seq: 4 });
	});

	it('puts a context', async () => {
		await con.put(5, { seq: 6 });
		expect(request).toBeCalledWith(Method.Put, 5, { seq: 6 });
	});

	it('deletes a context', async () => {
		await con.delete(7);
		expect(request).toBeCalledWith(Method.Delete, 7, undefined);
	});

	it('patches a context', async () => {
		await con.patch(8, { seq: 9 });
		expect(request).toBeCalledWith(Method.Patch, 8, { seq: 9 });
	});
});

describe('parameters', () => {
	it('gets a context', async () => {
		const [res] = await Promise.all([
			con.get(123),
			mockResponse({ test: 567 }),
		]);
		expect(res).toStrictEqual({ test: 567 });
	});

	it('posts to a context', async () => {
		const [res] = await Promise.all([
			con.post(333, { seq: 344 }),
			mockResponse({ ack: 345 }),
		]);
		expect(res).toStrictEqual({ ack: 345 });
	});
});

describe('timeout', () => {
	beforeAll(() => {
		con.setRequestTimeout(10);
	});

	it('deletes a context but timeout error occurs', async () => {
		expect(con.getRequestTimeout()).toBe(10);
		await expect(() => con.delete(789)).rejects.toThrowError('Time limit exceeded: 789 is not responded in 10ms');
	});

	it('clears timeout if resolved', async () => {
		await Promise.all([
			con.delete(7),
			mockResponse(),
		]);
	});
});

describe('message', () => {
	const onmessage = addEventListener.mock.calls[0][1];
	const emit = jest.spyOn(con, 'emit').mockReturnValue();

	afterEach(() => {
		emit.mockClear();
	});

	it('ignores invalid packets', () => {
		onmessage({ data: '{]' });
		onmessage({ data: '{}' });
	});

	it('handles a request', () => {
		mockRequest(88, Method.Post, 1);
		expect(emit).toBeCalledWith(Method.Post, 1, undefined);
	});

	it('handles a request error', () => {
		emit.mockImplementationOnce(() => {
			throw new Error('unknown');
		});
		mockRequest(567, Method.Post, 1);
		expect(send).toBeCalledWith('{"id":567,"params":"Error: unknown"}');
	});

	it('discards invalid response', () => {
		mockResponse(333);
	});

	it('responds to a request', () => {
		con.respond(8);
		expect(send).toBeCalledWith('{"id":8}');
	});

	it('responds to a request with parameters', () => {
		con.respond(9, { q: 22 });
		expect(send).toBeCalledWith('{"id":9,"params":{"q":22}}');
	});
});

describe('state', () => {
	it('gets ready state', () => {
		expect(con.getReadyState()).toBe(3);
	});

	it('closes the connection', async () => {
		await Promise.all([
			con.close(),
			(() => {
				const onclose = addEventListener.mock.calls[1][1];
				setTimeout(onclose, 0);
			})(),
		]);
		expect(close).toBeCalledTimes(1);
	});
});
