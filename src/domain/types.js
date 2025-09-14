export var DifficultyBand;
(function (DifficultyBand) {
    DifficultyBand["EASY"] = "EASY";
    DifficultyBand["MID"] = "MID";
    DifficultyBand["HARD"] = "HARD";
    DifficultyBand["ELITE"] = "ELITE";
})(DifficultyBand || (DifficultyBand = {}));
export var DefenseArchetype;
(function (DefenseArchetype) {
    DefenseArchetype["FIREWALL"] = "FIREWALL";
    DefenseArchetype["ICE_SENTINEL"] = "ICE_SENTINEL";
    DefenseArchetype["ENCRYPTION_LAYER"] = "ENCRYPTION_LAYER";
    DefenseArchetype["TRACE_ACCELERATOR"] = "TRACE_ACCELERATOR";
    DefenseArchetype["HONEYTRAP"] = "HONEYTRAP";
})(DefenseArchetype || (DefenseArchetype = {}));
export var ToolCategory;
(function (ToolCategory) {
    ToolCategory["SCANNER"] = "SCANNER";
    ToolCategory["CRACKER"] = "CRACKER";
    ToolCategory["BYPASS"] = "BYPASS";
    ToolCategory["SCRUBBER"] = "SCRUBBER";
    ToolCategory["UTILITY"] = "UTILITY";
})(ToolCategory || (ToolCategory = {}));
// Utility Guard Functions
export function isFlagExpressionGroup(obj) {
    if (typeof obj !== 'object' || obj === null)
        return false;
    const g = obj;
    const hasAll = !('all' in g) || Array.isArray(g.all);
    const hasAny = !('any' in g) || Array.isArray(g.any);
    return hasAll && hasAny;
}
export function evaluateFlagExpression(expr, flags) {
    if (!expr || expr.length === 0)
        return true; // no prereq
    return expr.some((group) => {
        if (!isFlagExpressionGroup(group))
            return false;
        const allOk = !group.all || group.all.every((f) => flags.has(f));
        const anyOk = !group.any || group.any.some((f) => flags.has(f));
        // group passes if both constraints satisfied (if present)
        return allOk && anyOk;
    });
}
// Reputation label helper (pure)
export function getReputationLabel(value, thresholds) {
    if (value <= thresholds.hostile)
        return 'HOSTILE';
    if (value > thresholds.allied)
        return 'ALLIED';
    if (value > thresholds.trusted)
        return 'TRUSTED';
    return 'NEUTRAL';
}
// Branded ID helpers
export const makeId = (raw) => raw;
