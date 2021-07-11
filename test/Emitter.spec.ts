import Emitter from '../src/Emitter';
import Method from '../src/Method';

const e = new Emitter();
const context = 526;
const get = jest.fn();

it('registers a listener', () => {
	e.on({ context, get });
});

it('handles a GET request', async () => {
	e.emit(Method.Get, context, 777);
	expect(get).toBeCalledWith(777);
	get.mockClear();
});

it('rejects non-existing contexts', async () => {
	await expect(() => e.emit(Method.Get, 999)).rejects.toThrowError('No such a context');
});

it('rejects unsupported methods', async () => {
	await expect(() => e.emit(Method.Post, context)).rejects.toThrowError('Method not supported');
});

it('rejects invalid methods', async () => {
	await expect(() => e.emit(888 as Method, context)).rejects.toThrowError('Invalid method');
});

it('unregiters a listener', async () => {
	e.off(context);
	await expect(() => e.emit(Method.Get, context)).rejects.toThrowError('No such a context');
});
