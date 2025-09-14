// Applies a one-time adaptive buff to active defenses when trace surpasses threshold.
// Simple model: if trace percent > 0.5 and defense active or pending, mark adaptiveApplied and
// increase tier by 1 (capped at +1 once).
export function applyAdaptive(session, threshold = 0.5) {
    const percent = session.trace.current / session.trace.max;
    if (percent <= threshold)
        return;
    for (const def of session.defenses) {
        if (!def.adaptiveApplied && (def.status === 'active' || def.status === 'pending')) {
            def.adaptiveApplied = true;
            def.tier += 1; // simplistic
        }
    }
}
