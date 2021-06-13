import Method from '../src/Method';
import Request from '../src/Request';

it('serialize a request', () => {
	const req = new Request(1, Method.Get, 111);
	expect(req.toString()).toBe('{"id":1,"method":1,"context":111}');
});
