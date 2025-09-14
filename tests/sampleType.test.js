import { expectTypeOf, describe, it } from 'vitest';
import { sum } from '../src';
describe('sample type checks', () => {
    it('sum has correct type signature', () => {
        expectTypeOf(sum).parameters.toEqualTypeOf();
        expectTypeOf(sum).returns.toBeNumber();
    });
});
