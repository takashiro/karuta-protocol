import Response from '../src/Response';

it('serializes a response', () => {
	const res = new Response(1, 2);
	expect(res.toString()).toBe('{"id":1,"params":2}');
});
