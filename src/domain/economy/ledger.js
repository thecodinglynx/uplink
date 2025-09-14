import { makeId, } from '../types';
export function createLedger() {
    return { transactions: [] };
}
function cloneLedger(ledger) {
    return { transactions: ledger.transactions.map((t) => ({ ...t })) };
}
function addTransaction(ledger, rec) {
    ledger.transactions.push(rec);
}
export function earnCredits(profile, ledger, amount, opts) {
    if (amount <= 0)
        throw new Error('INVALID_AMOUNT');
    const newProfile = { ...profile, credits: profile.credits + amount };
    const newLedger = cloneLedger(ledger);
    addTransaction(newLedger, {
        id: makeId(`tx_${newLedger.transactions.length + 1}`),
        profileId: profile.id,
        amount,
        type: 'earning',
        reason: opts.reason,
        timestamp: opts.now,
    });
    return { profile: newProfile, ledger: newLedger };
}
export function spendCredits(profile, ledger, amount, opts) {
    if (amount <= 0)
        throw new Error('INVALID_AMOUNT');
    if (profile.credits < amount)
        throw new Error('INSUFFICIENT_FUNDS');
    const newProfile = { ...profile, credits: profile.credits - amount };
    const newLedger = cloneLedger(ledger);
    addTransaction(newLedger, {
        id: makeId(`tx_${newLedger.transactions.length + 1}`),
        profileId: profile.id,
        amount: -amount,
        type: 'spend',
        reason: opts.reason,
        timestamp: opts.now,
    });
    return { profile: newProfile, ledger: newLedger };
}
// Discount calculation based on faction reputation label
export function applyFactionDiscount(baseCost, factions, discounts, toolCategory) {
    let best = 0;
    for (const d of discounts) {
        if (d.toolCategory && d.toolCategory !== toolCategory)
            continue;
        if (d.percent > best)
            best = d.percent;
    }
    const discounted = Math.round(baseCost * (1 - best / 100));
    return Math.max(0, discounted);
}
