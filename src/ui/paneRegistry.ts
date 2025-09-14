export type PaneId = string;

export interface PaneDefinition {
  id: PaneId;
  title: string;
  component: () => JSX.Element;
  defaultLayout: { x: number; y: number; w: number; h: number };
}

const registry: PaneDefinition[] = [];

export function registerPane(def: PaneDefinition) {
  if (registry.find((r) => r.id === def.id)) return; // ignore duplicate
  registry.push(def);
}

export function listPanes(): PaneDefinition[] {
  return registry.slice();
}
