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

it('rejects non-existing contexts', () => {
	expect(() => e.emit(Method.Get, 999)).toThrowError('No such a context');
});

it('rejects unsupported methods', () => {
	expect(() => e.emit(Method.Post, context)).toThrowError('Method not supported');
});

it('rejects invalid methods', () => {
	expect(() => e.emit(888 as Method, context)).toThrowError('Invalid method');
});

it('unregiters a listener', () => {
	e.off(context);
	expect(() => e.emit(Method.Get, context)).toThrowError('No such a context');
});
