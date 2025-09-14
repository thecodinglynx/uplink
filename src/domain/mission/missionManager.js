// Pure helper that indexes owned tool versions for quick lookup
function buildToolVersionMap(profile) {
    const map = {};
    for (const entry of profile.ownedToolVersions) {
        // keep highest version encountered (defensive)
        const existing = map[entry.toolId];
        if (existing === undefined || entry.version > existing)
            map[entry.toolId] = entry.version;
    }
    return map;
}
function evaluateGates(mission, profile, factionRepLookup) {
    const reasons = [];
    const gates = mission.gates;
    if (!gates)
        return reasons;
    // Flags
    if (gates.requiredFlags && gates.requiredFlags.length > 0) {
        for (const flag of gates.requiredFlags) {
            if (!profile.narrativeFlags.includes(flag)) {
                reasons.push({ code: 'MISSING_FLAG', detail: flag });
            }
        }
    }
    // Reputation
    if (gates.requiredReputation) {
        for (const req of gates.requiredReputation) {
            const val = factionRepLookup(req.factionId) ?? 0;
            if (val < req.min) {
                reasons.push({
                    code: 'REPUTATION_LOW',
                    detail: `${req.factionId}:${val}<${req.min}`,
                });
            }
        }
    }
    // Tool versions
    const toolVersions = buildToolVersionMap(profile);
    if (gates.requiredToolVersions) {
        for (const tv of gates.requiredToolVersions) {
            const current = toolVersions[tv.toolId] ?? 0;
            if (current < tv.minVersion) {
                reasons.push({
                    code: 'TOOL_VERSION_LOW',
                    detail: `${tv.toolId}:v${current}<v${tv.minVersion}`,
                });
            }
        }
    }
    // Hardware tier
    if (gates.minHardwareTier) {
        if (profile.hardwareTierId !== gates.minHardwareTier) {
            // Very simple gating; future: ranking order. For now mismatch treated as insufficient.
            if (profile.hardwareTierId !== gates.minHardwareTier) {
                reasons.push({
                    code: 'HARDWARE_TIER_LOW',
                    detail: `${profile.hardwareTierId}!=${gates.minHardwareTier}`,
                });
            }
        }
    }
    return reasons;
}
export function getMissionAvailabilities(ctx) {
    return ctx.missions.map((m) => {
        const reasons = evaluateGates(m, ctx.profile, ctx.factionRepLookup);
        return { mission: m, available: reasons.length === 0, reasons };
    });
}
export function acceptMission(ctx, missionId) {
    const mission = ctx.missions.find((m) => m.id === missionId);
    if (!mission)
        return { ok: false, reasons: [{ code: 'MISSING_FLAG', detail: 'NOT_FOUND' }] };
    const reasons = evaluateGates(mission, ctx.profile, ctx.factionRepLookup);
    if (reasons.length > 0)
        return { ok: false, reasons };
    // record acceptance
    ctx.acceptedMissions[mission.id] = { acceptedAt: ctx.now };
    return { ok: true };
}
export function abandonMission(ctx, missionId) {
    const record = ctx.acceptedMissions[missionId];
    if (!record)
        return { ok: false };
    const mission = ctx.missions.find((m) => m.id === missionId);
    if (!mission)
        return { ok: false };
    const abandonment = mission.abandonment;
    if (!abandonment) {
        delete ctx.acceptedMissions[missionId];
        return { ok: true };
    }
    if (abandonment.mode === 'returnsToPool') {
        delete ctx.acceptedMissions[missionId];
        return { ok: true, penaltyApplied: abandonment.penaltyCredits ?? 0 };
    }
    if (abandonment.mode === 'expires') {
        // On abandon, it is just removed and treated as expired permanently
        delete ctx.acceptedMissions[missionId];
        return { ok: true, penaltyApplied: abandonment.penaltyCredits ?? 0 };
    }
    delete ctx.acceptedMissions[missionId];
    return { ok: true };
}
export function purgeExpiredMissions(ctx) {
    const removed = [];
    for (const m of ctx.missions) {
        if (m.abandonment?.mode === 'expires') {
            const rec = ctx.acceptedMissions[m.id];
            if (rec) {
                // naive expiry: if soft time constraint present & exceeded hardSeconds treat as expire
                const hard = m.timeConstraints?.hardSeconds;
                if (hard != null) {
                    const duration = ctx.now - rec.acceptedAt;
                    if (duration > hard * 1000) {
                        delete ctx.acceptedMissions[m.id];
                        removed.push(m.id);
                    }
                }
            }
        }
    }
    return removed;
}
export function summarizeLockReasons(reasons) {
    return reasons.map((r) => r.code + '(' + r.detail + ')').join(', ');
}
// The module provides only pure/manipulative functions – integration layer (Redux thunks) will wrap these later.
