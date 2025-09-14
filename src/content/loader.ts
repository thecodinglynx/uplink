import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import Ajv, { ErrorObject } from 'ajv';

export interface ValidationResult<T> {
  items: T[];
  errors: Array<{ file: string; errors: ErrorObject[] }>;
  hash: string; // deterministic hash over accepted items
}

const ajv = new Ajv({ allErrors: true });

// Precompile schemas
const missionSchema = JSON.parse(fs.readFileSync(path.join('content', 'schema', 'mission.schema.json'), 'utf8'));
const narrativeSchema = JSON.parse(fs.readFileSync(path.join('content', 'schema', 'narrativeNode.schema.json'), 'utf8'));
const economySchema = JSON.parse(fs.readFileSync(path.join('content', 'schema', 'economy.schema.json'), 'utf8'));

const validateMission = ajv.compile(missionSchema);
const validateNarrative = ajv.compile(narrativeSchema);
const validateEconomy = ajv.compile(economySchema);

function dirFiles(dir: string) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => path.join(dir, f));
}

function stableHash(objs: unknown[]): string {
  const h = createHash('sha256');
  // stringify with stable ordering: sort keys recursively
  const ordered = JSON.stringify(objs, (_k, v) => {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return Object.keys(v).sort().reduce((acc, key) => {
        acc[key] = (v as any)[key];
        return acc;
      }, {} as any);
    }
    return v;
  });
  h.update(ordered);
  return h.digest('hex');
}

export function loadMissions(dir = path.join('content', 'missions')): ValidationResult<any> {
  const errors: ValidationResult<any>['errors'] = [];
  const items: any[] = [];
  for (const file of dirFiles(dir)) {
    const raw = fs.readFileSync(file, 'utf8');
    try {
      const json = JSON.parse(raw);
      if (validateMission(json)) items.push(json);
      else errors.push({ file, errors: validateMission.errors?.slice() || [] });
    } catch (e) {
      errors.push({ file, errors: [{ message: (e as Error).message } as any] });
    }
  }
  return { items, errors, hash: stableHash(items) };
}

export function loadNarrativeNodes(dir = path.join('content', 'narrative')): ValidationResult<any> {
  const errors: ValidationResult<any>['errors'] = [];
  const items: any[] = [];
  for (const file of dirFiles(dir)) {
    const raw = fs.readFileSync(file, 'utf8');
    try {
      const json = JSON.parse(raw);
      if (validateNarrative(json)) items.push(json);
      else errors.push({ file, errors: validateNarrative.errors?.slice() || [] });
    } catch (e) {
      errors.push({ file, errors: [{ message: (e as Error).message } as any] });
    }
  }
  return { items, errors, hash: stableHash(items) };
}

export function loadEconomyConfig(file = path.join('content', 'economy.json')): ValidationResult<any> {
  const errors: ValidationResult<any>['errors'] = [];
  if (!fs.existsSync(file)) {
    return { items: [], errors: [{ file, errors: [{ message: 'missing economy config' } as any] }], hash: '' };
  }
  const raw = fs.readFileSync(file, 'utf8');
  try {
    const json = JSON.parse(raw);
    if (validateEconomy(json)) return { items: [json], errors, hash: stableHash([json]) };
    return { items: [], errors: [{ file, errors: validateEconomy.errors?.slice() || [] }], hash: '' };
  } catch (e) {
    return { items: [], errors: [{ file, errors: [{ message: (e as Error).message } as any] }], hash: '' };
  }
}
