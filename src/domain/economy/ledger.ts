import {
  makeId,
  type ProfileDefinition,
  type TransactionRecord,
  type TransactionId,
  type FactionDefinition,
  type ToolCategory,
} from '../types';

export interface LedgerState {
  transactions: TransactionRecord[];
}

export function createLedger(): LedgerState {
  return { transactions: [] };
}

function cloneLedger(ledger: LedgerState): LedgerState {
  return { transactions: ledger.transactions.map((t) => ({ ...t })) };
}

function addTransaction(ledger: LedgerState, rec: TransactionRecord) {
  ledger.transactions.push(rec);
}

export interface EarnOptions {
  reason: string;
  now: number;
}
export interface SpendOptions {
  reason: string;
  now: number;
}

export function earnCredits(
  profile: ProfileDefinition,
  ledger: LedgerState,
  amount: number,
  opts: EarnOptions,
) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  const newProfile = { ...profile, credits: profile.credits + amount };
  const newLedger = cloneLedger(ledger);
  addTransaction(newLedger, {
    id: makeId<'TransactionId'>(`tx_${newLedger.transactions.length + 1}`),
    profileId: profile.id,
    amount,
    type: 'earning',
    reason: opts.reason,
    timestamp: opts.now,
  });
  return { profile: newProfile, ledger: newLedger };
}

export function spendCredits(
  profile: ProfileDefinition,
  ledger: LedgerState,
  amount: number,
  opts: SpendOptions,
) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  if (profile.credits < amount) throw new Error('INSUFFICIENT_FUNDS');
  const newProfile = { ...profile, credits: profile.credits - amount };
  const newLedger = cloneLedger(ledger);
  addTransaction(newLedger, {
    id: makeId<'TransactionId'>(`tx_${newLedger.transactions.length + 1}`),
    profileId: profile.id,
    amount: -amount,
    type: 'spend',
    reason: opts.reason,
    timestamp: opts.now,
  });
  return { profile: newProfile, ledger: newLedger };
}

// Discount calculation based on faction reputation label
export function applyFactionDiscount(
  baseCost: number,
  factions: FactionDefinition[],
  discounts: { toolCategory?: ToolCategory; percent: number }[],
  toolCategory?: ToolCategory,
): number {
  let best = 0;
  for (const d of discounts) {
    if (d.toolCategory && d.toolCategory !== toolCategory) continue;
    if (d.percent > best) best = d.percent;
  }
  const discounted = Math.round(baseCost * (1 - best / 100));
  return Math.max(0, discounted);
}
