const registry = [];
export function registerPane(def) {
    if (registry.find((r) => r.id === def.id))
        return; // ignore duplicate
    registry.push(def);
}
export function listPanes() {
    return registry.slice();
}
