import {
  makeId,
  type ProfileDefinition,
  type HardwareTier,
  type ToolDefinition,
  type ToolId,
  type HardwareTierId,
} from '@domain/types';

export interface UpgradeResult {
  profile: ProfileDefinition;
  spent: number;
  reason: string;
}

function cloneProfile(profile: ProfileDefinition): ProfileDefinition {
  return { ...profile, ownedToolVersions: profile.ownedToolVersions.map((v) => ({ ...v })) };
}

export function canUpgradeHardware(
  currentTierId: HardwareTierId,
  tiers: HardwareTier[],
): { next?: HardwareTier; reason?: string } {
  const idx = tiers.findIndex((t) => t.id === currentTierId);
  if (idx === -1) return { reason: 'UNKNOWN_TIER' };
  if (idx === tiers.length - 1) return { reason: 'MAX_TIER' };
  return { next: tiers[idx + 1] };
}

export function purchaseHardwareUpgrade(
  profile: ProfileDefinition,
  tiers: HardwareTier[],
  now: number,
): UpgradeResult {
  const { next, reason } = canUpgradeHardware(profile.hardwareTierId, tiers);
  if (!next) throw new Error(`Cannot upgrade: ${reason}`);
  if (profile.credits < next.cost) throw new Error('INSUFFICIENT_CREDITS');
  const clone = cloneProfile(profile);
  clone.credits -= next.cost;
  clone.hardwareTierId = next.id;
  return { profile: clone, spent: next.cost, reason: 'HARDWARE_UPGRADE' };
}

export interface ToolVersionPurchaseResult extends UpgradeResult {
  newVersion: number;
}

export function purchaseToolVersion(
  profile: ProfileDefinition,
  tool: ToolDefinition,
  hardwareTiers: HardwareTier[],
  version: number,
  now: number,
): ToolVersionPurchaseResult {
  if (version < 1) throw new Error('INVALID_VERSION');
  const existing = profile.ownedToolVersions.find((v) => v.toolId === tool.id);
  const currentVersion = existing?.version ?? 0;
  if (version !== currentVersion + 1) throw new Error('MUST_PURCHASE_NEXT_INCREMENT');
  if (version > tool.versions.length) throw new Error('VERSION_OUT_OF_RANGE');
  // gating by hardware tier
  if (profile.hardwareTierId !== tool.minHardwareTier) {
    // simple gating: require exact tier for now (could be >= later)
    if (profile.hardwareTierId !== tool.minHardwareTier) throw new Error('HARDWARE_TIER_TOO_LOW');
  }
  const def = tool.versions[version - 1];
  if (profile.credits < def.cost) throw new Error('INSUFFICIENT_CREDITS');
  const clone = cloneProfile(profile);
  clone.credits -= def.cost;
  if (existing) existing.version = version;
  else clone.ownedToolVersions.push({ toolId: tool.id, version });
  return { profile: clone, spent: def.cost, reason: 'TOOL_VERSION_PURCHASE', newVersion: version };
}

// Derived helpers
export function getToolOperationTimeModifier(tool: ToolDefinition, ownedVersion: number): number {
  if (ownedVersion <= 0) return 1;
  const def = tool.versions[Math.min(ownedVersion, tool.versions.length) - 1];
  return def.baseOperationTimeModifier;
}

export function getHardwareConcurrencySlots(tiers: HardwareTier[], tierId: HardwareTierId): number {
  const t = tiers.find((t) => t.id === tierId);
  return t ? t.concurrencySlots : 1;
}
