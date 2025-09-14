import type { NarrativeNodeDefinition, NarrativeNodeId } from '../types';
import { evaluateFlagExpression } from '../types';

export interface NarrativeState {
  flags: Set<string>;
  seenNodes: Set<NarrativeNodeId>;
  endingsUnlocked: Set<NarrativeNodeId>;
  irreversibleChosen: Set<NarrativeNodeId>; // nodes that lock out siblings
}

export function createNarrativeState(initialFlags: string[] = []): NarrativeState {
  return {
    flags: new Set(initialFlags),
    seenNodes: new Set(),
    endingsUnlocked: new Set(),
    irreversibleChosen: new Set(),
  };
}

export interface AvailabilityResult {
  node: NarrativeNodeDefinition;
  available: boolean;
  lockedByIrreversible?: boolean;
  missingPrereq?: boolean;
}

export function evaluateAvailability(
  nodes: NarrativeNodeDefinition[],
  state: NarrativeState,
): AvailabilityResult[] {
  return nodes.map((n) => {
    let lockedByIrreversible = false;
    // If any irreversible sibling (same act) chosen and node not that node
    if (state.irreversibleChosen.size > 0) {
      for (const chosen of state.irreversibleChosen) {
        if (nodes.find((x) => x.id === chosen)?.act === n.act && chosen !== n.id) {
          lockedByIrreversible = true;
          break;
        }
      }
    }
    const missingPrereq = !evaluateFlagExpression(n.prerequisites, state.flags);
    const available = !lockedByIrreversible && !missingPrereq;
    return { node: n, available, lockedByIrreversible, missingPrereq };
  });
}

export interface ChooseNodeResult {
  ok: boolean;
  reason?: string;
}

export function chooseNode(
  node: NarrativeNodeDefinition,
  allNodes: NarrativeNodeDefinition[],
  state: NarrativeState,
  irreversible = false,
): ChooseNodeResult {
  const availability = evaluateAvailability(allNodes, state).find((r) => r.node.id === node.id);
  if (!availability) return { ok: false, reason: 'NOT_FOUND' };
  if (!availability.available) return { ok: false, reason: 'NOT_AVAILABLE' };
  state.seenNodes.add(node.id);
  if (node.resultingFlags) for (const f of node.resultingFlags) state.flags.add(f);
  if (irreversible) state.irreversibleChosen.add(node.id);
  if (node.isEnding) state.endingsUnlocked.add(node.id);
  return { ok: true };
}
