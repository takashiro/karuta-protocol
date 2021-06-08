import Method from '../src/Method';
import Packet from '../src/Packet';

describe('Packet', () => {
	it('creates an invalid packet', () => {
		const packet = new Packet(Method.Unknown, 0);
		expect(packet.method).toBe(0);
		expect(packet.params).toBeUndefined();
		expect(packet.toJSON()).toBe('{"method":0,"context":0}');
	});

	it('accepts invalid JSON', () => {
		expect(() => Packet.parse('{')).toThrowError('Unexpected end of JSON input');
	});

	it('accepts non-array input', () => {
		const packet = Packet.parse('{}');
		expect(packet.method).toBeUndefined();
		expect(packet.params).toBeUndefined();
	});

	it('creates a packet', () => {
		const packet = Packet.parse('{"method":1}');
		expect(packet.method).toBe(1);
		expect(packet.toJSON()).toBe('{"method":1}');
	});

	it('creates a packet with context and params', () => {
		const raw = '{"method":2,"context":34,"params":45}';
		const packet = Packet.parse(raw);
		expect(packet.toJSON()).toBe(raw);
	});
});
