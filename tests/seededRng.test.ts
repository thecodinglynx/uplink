import { describe, it, expect } from 'vitest';

import { createRng } from '../src/test/seededRng';

describe('seededRng', () => {
  it('produces deterministic sequence per seed', () => {
    const a = createRng(123);
    const b = createRng(123);
    const seqA = Array.from({ length: 5 }, () => a.next());
    const seqB = Array.from({ length: 5 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('different seeds differ', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 3 }, () => a.next());
    const seqB = Array.from({ length: 3 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });
});
