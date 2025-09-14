import type {
  FactionDefinition,
  ReputationRecord,
  ReputationChangeRecord,
  FactionId,
  ProfileDefinition,
} from '../types';
import { getReputationLabel } from '../types';

export interface AdjustResult {
  profile: ProfileDefinition; // shallow cloned with updated reputations array
  change: ReputationChangeRecord;
  previousLabel: string;
  newLabel: string;
}

function cloneProfile(profile: ProfileDefinition): ProfileDefinition {
  return { ...profile, factionReputations: profile.factionReputations.map((r) => ({ ...r })) };
}

function findFaction(defs: FactionDefinition[], id: FactionId): FactionDefinition | undefined {
  return defs.find((f) => f.id === id);
}

function getRepRecord(profile: ProfileDefinition, id: FactionId): ReputationRecord {
  let rec = profile.factionReputations.find((r) => r.factionId === id);
  if (!rec) {
    rec = { factionId: id, value: 0, lastUpdated: Date.now() };
    profile.factionReputations.push(rec);
  }
  return rec;
}

// Exclusive lock policy: only one faction may be ALLIED at a time. If a faction crosses into ALLIED, clamp others down to at most trusted-1 if needed.
function enforceExclusiveAllied(
  profile: ProfileDefinition,
  factionDefs: FactionDefinition[],
  alliedFactionId: FactionId,
) {
  for (const rec of profile.factionReputations) {
    if (rec.factionId === alliedFactionId) continue;
    const def = findFaction(factionDefs, rec.factionId);
    if (!def) continue;
    const thresholds = def.thresholds;
    if (rec.value > thresholds.trusted) {
      // regardless of whether it already reached allied, reduce to trusted
      rec.value = thresholds.trusted;
    }
  }
}

export function adjustReputation(
  profile: ProfileDefinition,
  factionDefs: FactionDefinition[],
  factionId: FactionId,
  delta: number,
  now: number,
  reason: string,
): AdjustResult {
  const clone = cloneProfile(profile);
  const rec = getRepRecord(clone, factionId);
  const def = findFaction(factionDefs, factionId);
  if (!def) throw new Error('Faction definition missing');
  const thresholds = def.thresholds;
  const prevLabel = getReputationLabel(rec.value, thresholds);
  rec.value = Math.max(-100, Math.min(100, rec.value + delta));
  rec.lastUpdated = now;
  let newLabel = getReputationLabel(rec.value, thresholds);
  if (newLabel === 'ALLIED') {
    // If another faction is already allied, demote this one to trusted threshold instead of stealing slot
    const existingAllied = clone.factionReputations.find(
      (r) =>
        r.factionId !== factionId &&
        getReputationLabel(r.value, findFaction(factionDefs, r.factionId)!.thresholds) === 'ALLIED',
    );
    if (existingAllied) {
      rec.value = thresholds.trusted; // clamp back
      newLabel = getReputationLabel(rec.value, thresholds);
    } else {
      // This faction becomes allied; demote any others above trusted
      enforceExclusiveAllied(clone, factionDefs, factionId);
    }
  }
  const change: ReputationChangeRecord = {
    factionId,
    delta,
    reason,
    timestamp: now,
  };
  return { profile: clone, change, previousLabel: prevLabel, newLabel };
}

export interface DecayOptions {
  inactivityMs: number; // if lastUpdated older than now - inactivityMs apply decay step toward 0
  decayStep: number; // magnitude to move toward 0
}

export function applyDecay(
  profile: ProfileDefinition,
  factionDefs: FactionDefinition[],
  now: number,
  opts: DecayOptions,
): ProfileDefinition {
  const clone = cloneProfile(profile);
  for (const rec of clone.factionReputations) {
    if (now - rec.lastUpdated < opts.inactivityMs) continue;
    if (rec.value > 0) rec.value = Math.max(0, rec.value - opts.decayStep);
    else if (rec.value < 0) rec.value = Math.min(0, rec.value + opts.decayStep);
  }
  return clone;
}

export function getFactionLabel(
  factionDefs: FactionDefinition[],
  factionId: FactionId,
  value: number,
): string {
  const def = findFaction(factionDefs, factionId);
  if (!def) return 'UNKNOWN';
  return getReputationLabel(value, def.thresholds);
}
