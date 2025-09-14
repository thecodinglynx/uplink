import { getReputationLabel } from '../types';
function cloneProfile(profile) {
    return { ...profile, factionReputations: profile.factionReputations.map((r) => ({ ...r })) };
}
function findFaction(defs, id) {
    return defs.find((f) => f.id === id);
}
function getRepRecord(profile, id) {
    let rec = profile.factionReputations.find((r) => r.factionId === id);
    if (!rec) {
        rec = { factionId: id, value: 0, lastUpdated: Date.now() };
        profile.factionReputations.push(rec);
    }
    return rec;
}
// Exclusive lock policy: only one faction may be ALLIED at a time. If a faction crosses into ALLIED, clamp others down to at most trusted-1 if needed.
function enforceExclusiveAllied(profile, factionDefs, alliedFactionId) {
    for (const rec of profile.factionReputations) {
        if (rec.factionId === alliedFactionId)
            continue;
        const def = findFaction(factionDefs, rec.factionId);
        if (!def)
            continue;
        const thresholds = def.thresholds;
        if (rec.value > thresholds.trusted) {
            // regardless of whether it already reached allied, reduce to trusted
            rec.value = thresholds.trusted;
        }
    }
}
export function adjustReputation(profile, factionDefs, factionId, delta, now, reason) {
    const clone = cloneProfile(profile);
    const rec = getRepRecord(clone, factionId);
    const def = findFaction(factionDefs, factionId);
    if (!def)
        throw new Error('Faction definition missing');
    const thresholds = def.thresholds;
    const prevLabel = getReputationLabel(rec.value, thresholds);
    rec.value = Math.max(-100, Math.min(100, rec.value + delta));
    rec.lastUpdated = now;
    let newLabel = getReputationLabel(rec.value, thresholds);
    if (newLabel === 'ALLIED') {
        // If another faction is already allied, demote this one to trusted threshold instead of stealing slot
        const existingAllied = clone.factionReputations.find((r) => r.factionId !== factionId &&
            getReputationLabel(r.value, findFaction(factionDefs, r.factionId).thresholds) === 'ALLIED');
        if (existingAllied) {
            rec.value = thresholds.trusted; // clamp back
            newLabel = getReputationLabel(rec.value, thresholds);
        }
        else {
            // This faction becomes allied; demote any others above trusted
            enforceExclusiveAllied(clone, factionDefs, factionId);
        }
    }
    const change = {
        factionId,
        delta,
        reason,
        timestamp: now,
    };
    return { profile: clone, change, previousLabel: prevLabel, newLabel };
}
export function applyDecay(profile, factionDefs, now, opts) {
    const clone = cloneProfile(profile);
    for (const rec of clone.factionReputations) {
        if (now - rec.lastUpdated < opts.inactivityMs)
            continue;
        if (rec.value > 0)
            rec.value = Math.max(0, rec.value - opts.decayStep);
        else if (rec.value < 0)
            rec.value = Math.min(0, rec.value + opts.decayStep);
    }
    return clone;
}
export function getFactionLabel(factionDefs, factionId, value) {
    const def = findFaction(factionDefs, factionId);
    if (!def)
        return 'UNKNOWN';
    return getReputationLabel(value, def.thresholds);
}
