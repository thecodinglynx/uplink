import { describe, it, expect } from 'vitest';
import { makeId } from '../src/domain/types';
import {
  createNarrativeState,
  evaluateAvailability,
  chooseNode,
} from '../src/domain/narrative/branching';

function node(id: string, act: number, extras: any = {}) {
  return { id: makeId<'NarrativeNodeId'>(id), act, version: 1, ...extras };
}

describe('narrative branching', () => {
  it('evaluates prerequisites and sets flags', () => {
    const n1 = node('n1', 1, { resultingFlags: ['flagA'] });
    const n2 = node('n2', 1, { prerequisites: [{ all: ['flagA'] }] });
    const state = createNarrativeState();
    let avail = evaluateAvailability([n1, n2], state);
    expect(avail.find((a) => a.node.id === n2.id)!.available).toBe(false);
    chooseNode(n1, [n1, n2], state);
    avail = evaluateAvailability([n1, n2], state);
    expect(avail.find((a) => a.node.id === n2.id)!.available).toBe(true);
  });

  it('irreversible choice locks siblings', () => {
    const a = node('a', 1, {});
    const b = node('b', 1, {});
    const state = createNarrativeState();
    const res = chooseNode(a, [a, b], state, true);
    expect(res.ok).toBe(true);
    const avail = evaluateAvailability([a, b], state);
    const bAvail = avail.find((v) => v.node.id === b.id)!;
    expect(bAvail.available).toBe(false);
    expect(bAvail.lockedByIrreversible).toBe(true);
  });

  it('records endings', () => {
    const end = node('end', 2, { isEnding: true });
    const state = createNarrativeState();
    chooseNode(end, [end], state);
    expect(state.endingsUnlocked.has(end.id)).toBe(true);
  });
});
