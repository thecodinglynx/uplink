// Core domain type declarations (Step 2)
// Enums & Branded IDs
export type Brand<K, T> = K & { __brand: T };

export type ProfileId = Brand<string, 'ProfileId'>;
export type HardwareTierId = Brand<string, 'HardwareTierId'>;
export type ToolId = Brand<string, 'ToolId'>;
export type MissionId = Brand<string, 'MissionId'>;
export type ObjectiveId = Brand<string, 'ObjectiveId'>;
export type BonusId = Brand<string, 'BonusId'>;
export type DefenseId = Brand<string, 'DefenseId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type ToolRunId = Brand<string, 'ToolRunId'>;
export type LogId = Brand<string, 'LogId'>;
export type NarrativeNodeId = Brand<string, 'NarrativeNodeId'>;
export type FactionId = Brand<string, 'FactionId'>;
export type TransactionId = Brand<string, 'TransactionId'>;
export type SaveSlotId = Brand<string, 'SaveSlotId'>;

export enum DifficultyBand {
  EASY = 'EASY',
  MID = 'MID',
  HARD = 'HARD',
  ELITE = 'ELITE',
}

export enum DefenseArchetype {
  FIREWALL = 'FIREWALL',
  ICE_SENTINEL = 'ICE_SENTINEL',
  ENCRYPTION_LAYER = 'ENCRYPTION_LAYER',
  TRACE_ACCELERATOR = 'TRACE_ACCELERATOR',
  HONEYTRAP = 'HONEYTRAP',
}

export enum ToolCategory {
  SCANNER = 'SCANNER',
  CRACKER = 'CRACKER',
  BYPASS = 'BYPASS',
  SCRUBBER = 'SCRUBBER',
  UTILITY = 'UTILITY',
}

export interface HardwareTier {
  id: HardwareTierId;
  version: number; // schema version for forward compatibility
  concurrencySlots: number;
  memoryCapacity: number;
  traceResistance: number; // reduces effective trace rate
  cost: number;
  visualKey: string;
}

export interface ToolVersion {
  version: number;
  baseOperationTimeModifier: number; // multiplier applied to base tool time (<1 faster)
  noiseFactor: number; // influences trace rate modifiers
  successTierOffset: number; // maybe influences chance; for v1 reserved
  cost: number;
}

export interface ToolDefinition {
  id: ToolId;
  category: ToolCategory;
  minHardwareTier: HardwareTierId; // gating
  description: string;
  versions: ToolVersion[]; // ascending order
}

export interface ObjectiveDefinition {
  id: ObjectiveId;
  type: 'exfiltrate' | 'modify' | 'plant' | 'scan' | 'analyze';
  targetCount: number;
  partialBuckets?: Array<{ threshold: number; payoutFraction: number }>;
}

export interface BonusConditionDefinition {
  id: BonusId;
  conditionType: 'time' | 'noTraceSpike' | 'noFailure' | 'completeAll';
  thresholds?: number[];
  bonusPayout: number;
  description: string;
}

export interface MissionGates {
  requiredFlags?: string[];
  requiredReputation?: Array<{ factionId: FactionId; min: number }>; // -100..+100
  requiredToolVersions?: Array<{ toolId: ToolId; minVersion: number }>;
  minHardwareTier?: HardwareTierId;
}

export interface DefenseTemplateSlot {
  archetype: DefenseArchetype;
  minTier: number;
  maxTier: number;
  highNoise?: boolean; // used for shuffle constraint
}

export interface MissionDefinition {
  id: MissionId;
  title: string;
  type: string;
  factions: FactionId[];
  difficultyBand: DifficultyBand;
  basePayoutRange: [number, number];
  objectives: ObjectiveDefinition[];
  bonusConditions?: BonusConditionDefinition[];
  defenseTemplate: DefenseTemplateSlot[];
  reputationEffects?: Array<{ factionId: FactionId; delta: number; on: 'success' | 'failure' }>;
  gates?: MissionGates;
  abandonment?: { mode: 'returnsToPool' | 'expires'; penaltyCredits?: number };
  timeConstraints?: { softSeconds?: number; hardSeconds?: number };
  seedMode: 'FIXED' | 'RANDOM' | 'HASH_TITLE';
  version: number;
}

export type ObjectiveProgressState = 'pending' | 'inProgress' | 'complete';

export interface ObjectiveInstance extends ObjectiveDefinition {
  progressState: ObjectiveProgressState;
  currentCount: number;
}

export interface DefenseLayerInstance {
  id: DefenseId;
  archetype: DefenseArchetype;
  tier: number;
  adaptiveApplied: boolean;
  currentProgress: number; // 0..1
  status: 'pending' | 'active' | 'bypassed' | 'failed';
  noiseEvents: Array<{ magnitude: number; expiresAt: number }>;
  highNoise?: boolean; // metadata for ordering/tests
}

export interface ToolRunInstance {
  id: ToolRunId;
  toolId: ToolId;
  targetDefenseId: DefenseId;
  startTime: number; // epoch ms
  eta: number; // epoch ms
  progress: number; // 0..1
  canceled: boolean;
}

export interface TraceState {
  current: number;
  max: number;
  baseRate: number;
  dynamicRateModifiers: number[]; // additive values
  estimatedTimeToTrace?: number; // derived
}

export type LogCategory = 'authentication' | 'intrusion' | 'scrub';
export type ScrubStatus = 'present' | 'scrubbing' | 'removed' | 'partial';

export interface LogEntry {
  id: LogId;
  category: LogCategory;
  timestamp: number;
  size: number;
  scrubStatus: ScrubStatus;
}

export interface HackingSessionInstance {
  id: SessionId;
  missionId: MissionId;
  defenses: DefenseLayerInstance[];
  toolRuns: ToolRunInstance[];
  trace: TraceState;
  logs: LogEntry[];
  startTimestamp: number;
  seed: number;
  status: 'active' | 'failed' | 'success' | 'abandoned';
  lastTick: number;
}

// Narrative
export interface NarrativeNodeDefinition {
  id: NarrativeNodeId;
  act: number;
  branchPointFlagSet?: string[]; // when this node becomes branch point
  prerequisites?: FlagExpression; // OR of AND groups
  resultingFlags?: string[];
  isEnding?: boolean;
  codename?: string; // for endings
  version: number;
}

export type FlagExpressionGroup = { all?: string[]; any?: string[] }; // within group: AND of 'all' and OR of 'any'
export type FlagExpression = FlagExpressionGroup[]; // OR across groups

export interface FactionDefinition {
  id: FactionId;
  name: string;
  description: string;
  thresholds: { hostile: number; trusted: number; allied: number }; // values in -100..+100 ascending
  unlockMissions?: MissionId[];
  discountRules?: Array<{ toolCategory?: ToolCategory; percent: number }>;
}

export interface ReputationRecord {
  factionId: FactionId;
  value: number; // -100..+100
  lastUpdated: number; // epoch ms
}

export interface ReputationChangeRecord {
  factionId: FactionId;
  delta: number;
  reason: string;
  timestamp: number;
}

export interface EconomyConfig {
  difficultyMultipliers: Record<DifficultyBand, number>;
  pricingCurves: { hardware: number[]; toolBase: number; versionBoostBase: number };
  upgradeCostScaling: number; // factor
  payoutBalancing: { earlyGameFactor: number; lateGameFactor: number };
  toolVersionPerformanceIncrement: number; // >= 0.1 guarantee
  reputationDiscountFactors: { trusted: number; allied: number };
  decayStep: number; // reputation decay step toward 0 per inactivity period
  traceBaseRatesByDifficulty: Record<DifficultyBand, number>;
  version: number;
}

export interface TransactionRecord {
  id: TransactionId;
  profileId: ProfileId;
  amount: number; // + credits earned, - spent
  type: 'earning' | 'spend';
  reason: string;
  timestamp: number;
}

export interface ScanResult {
  defenseId: DefenseId;
  revealedAt: number;
  category: DefenseArchetype;
}

export interface ProfileStatsSnapshot {
  missionsCompleted: number;
  completionPercent: number; // derived across available missions
}

export interface LayoutPreferences {
  panes: Array<{ id: string; x: number; y: number; w: number; h: number; z: number }>;
  theme: 'dark' | 'light';
}

export interface ProfileDefinition {
  id: ProfileId;
  username: string;
  passwordHash: string; // hashed; salt stored inline or structured (omitted detail)
  credits: number;
  hardwareTierId: HardwareTierId;
  ownedToolVersions: Array<{ toolId: ToolId; version: number }>;
  narrativeFlags: string[];
  factionReputations: ReputationRecord[];
  endingsUnlocked: NarrativeNodeId[];
  layoutPreferences: LayoutPreferences;
  stats: ProfileStatsSnapshot;
  version: number;
}

export interface SaveSlotMetadata {
  id: SaveSlotId;
  profileId: ProfileId;
  schemaVersion: number;
  updatedAt: number;
  missionCount: number;
  summaryCredits: number;
  version: number;
}

// Utility Guard Functions
export function isFlagExpressionGroup(obj: unknown): obj is FlagExpressionGroup {
  if (typeof obj !== 'object' || obj === null) return false;
  const g = obj as Record<string, unknown>;
  const hasAll = !('all' in g) || Array.isArray(g.all);
  const hasAny = !('any' in g) || Array.isArray(g.any);
  return hasAll && hasAny;
}

export function evaluateFlagExpression(
  expr: FlagExpression | undefined,
  flags: Set<string>,
): boolean {
  if (!expr || expr.length === 0) return true; // no prereq
  return expr.some((group) => {
    if (!isFlagExpressionGroup(group)) return false;
    const allOk = !group.all || group.all.every((f) => flags.has(f));
    const anyOk = !group.any || group.any.some((f) => flags.has(f));
    // group passes if both constraints satisfied (if present)
    return allOk && anyOk;
  });
}

// Reputation label helper (pure)
export function getReputationLabel(
  value: number,
  thresholds: { hostile: number; trusted: number; allied: number },
): 'HOSTILE' | 'NEUTRAL' | 'TRUSTED' | 'ALLIED' {
  if (value <= thresholds.hostile) return 'HOSTILE';
  if (value > thresholds.allied) return 'ALLIED';
  if (value > thresholds.trusted) return 'TRUSTED';
  return 'NEUTRAL';
}

// Branded ID helpers
export const makeId = <T extends string>(raw: string) => raw as Brand<string, T>;
