import { describe, it, expect } from 'vitest';
import { evaluateFlagExpression, getReputationLabel, DifficultyBand } from '../src/domain/types';
describe('flag expression evaluation', () => {
    it('returns true when expression empty', () => {
        expect(evaluateFlagExpression([], new Set())).toBe(true);
        expect(evaluateFlagExpression(undefined, new Set())).toBe(true);
    });
    it('evaluates OR of groups, AND within all[] and OR within any[]', () => {
        const expr = [{ all: ['A', 'B'] }, { any: ['C'] }];
        expect(evaluateFlagExpression(expr, new Set(['A']))).toBe(false);
        expect(evaluateFlagExpression(expr, new Set(['A', 'B']))).toBe(true); // first group satisfied
        expect(evaluateFlagExpression(expr, new Set(['C']))).toBe(true); // second group satisfied
    });
});
describe('reputation label', () => {
    const thresholds = { hostile: -50, trusted: 1, allied: 50 };
    it('classifies values across bands', () => {
        expect(getReputationLabel(-80, thresholds)).toBe('HOSTILE');
        expect(getReputationLabel(0, thresholds)).toBe('NEUTRAL');
        expect(getReputationLabel(10, thresholds)).toBe('TRUSTED');
        expect(getReputationLabel(60, thresholds)).toBe('ALLIED');
    });
});
describe('enum stability sample', () => {
    it('covers difficulty band values', () => {
        expect(Object.values(DifficultyBand).sort()).toEqual(['EASY', 'ELITE', 'HARD', 'MID']);
    });
});
