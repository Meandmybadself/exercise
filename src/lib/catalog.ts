import type { Exercise, MuscleGroup } from './types'

export interface CatalogItem {
  name: string
  muscle: MuscleGroup
}

/** Known gym equipment. More gets added here as machines are photographed. */
export const CATALOG: CatalogItem[] = [
  { name: 'Naut. Nitro Adductor', muscle: 'adductors' },
  { name: 'Naut. Nitro Abductor', muscle: 'abductors' },
  { name: 'Naut. Nitro Abdominals', muscle: 'core' },
  { name: 'Hammer Incline Press', muscle: 'chest' },
  { name: 'MedX Pullover', muscle: 'back' },
  { name: 'MedX Torso Arm - Sup.', muscle: 'back' },
  { name: 'Hoist Chin/Dip Assist', muscle: 'back' },
  { name: 'Hammer Lateral Raise', muscle: 'shoulders' },
  { name: 'Precor Shoulder Press 500', muscle: 'shoulders' },
  { name: 'Life Fitness Torso Rotation', muscle: 'core' },
  { name: 'Freemotion Genesis Step', muscle: 'quads' },
  { name: 'Hammer Belt Squat', muscle: 'quads' },
  { name: 'Hammer Hack Squat', muscle: 'quads' },
  { name: 'Technogym Leg Extension', muscle: 'quads' },
  { name: 'Life Fitness Kneeling Leg Curl', muscle: 'hamstrings' },
  { name: 'Life Fitness High Row', muscle: 'back' },
  { name: 'Life Fitness Seated Row', muscle: 'back' },
  { name: 'Technogym Upper Back Selection', muscle: 'back' },
  { name: 'Hoist Biceps Curl', muscle: 'biceps' },
  { name: 'Life Fitness Biceps Curl', muscle: 'biceps' },
  { name: 'Freemotion Genesis Dual Cable Cross', muscle: 'chest' },
  { name: 'Freemotion Genesis Squat', muscle: 'quads' },
  { name: 'Life Fitness Hip Abduction', muscle: 'abductors' },
  { name: 'Life Fitness Hip Adduction', muscle: 'adductors' },
  { name: 'Hoist Leg Extension', muscle: 'quads' },
  { name: 'Life Fitness Seated Leg Press', muscle: 'quads' },
  { name: 'Life Fitness Seated Leg Curl', muscle: 'hamstrings' },
  { name: 'Technogym Prone Leg Curl', muscle: 'hamstrings' },
  { name: 'Cybex Eagle Prone Leg Curl', muscle: 'hamstrings' },
  { name: 'Technogym Lat Machine', muscle: 'back' },
  { name: 'Life Fitness Lat Pulldown', muscle: 'back' },
  { name: 'Hoist Mid Row', muscle: 'back' },
  { name: 'Hoist Shoulder Press', muscle: 'shoulders' },
  { name: 'Life Fitness Shoulder Press', muscle: 'shoulders' },
]

const norm = (name: string) => name.trim().toLowerCase()
const byName = new Map(CATALOG.map((c) => [norm(c.name), c]))

export function catalogMuscle(name: string): MuscleGroup | undefined {
  return byName.get(norm(name))?.muscle
}

/** Catalog entries whose name isn't already in the library (archived ones count as present). */
export function missingFromCatalog(existingNames: string[]): CatalogItem[] {
  return CATALOG.filter((c) => !existingNames.some((n) => isSameMachine(n, c.name)))
}

/** Words that name a maker or product line, grouped so spelling variants count as one brand. */
const BRAND_TOKENS: Record<string, string> = {
  life: 'lifefitness', fitness: 'lifefitness', lf: 'lifefitness', lifetime: 'lifefitness',
  hammer: 'hammer', strength: 'hammer',
  hoist: 'hoist', roc: 'hoist', rocit: 'hoist', it: 'hoist',
  technogym: 'technogym', selection: 'technogym',
  precor: 'precor',
  freemotion: 'freemotion', genesis: 'freemotion',
  cybex: 'cybex', eagle: 'cybex',
  naut: 'nautilus', nautilus: 'nautilus', nitro: 'nautilus',
  medx: 'medx',
}

/** Splits a name into its machine words and brand (if any): "Hoist Biceps Curl" → core "biceps curl", brand "hoist". */
function parseName(name: string): { core: string; brand: string | undefined; full: string } {
  const tokens = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
  const core = tokens.filter((t) => !(t in BRAND_TOKENS))
  const brand = tokens.map((t) => BRAND_TOKENS[t]).find(Boolean)
  return { core: core.join(' '), brand, full: tokens.join(' ') }
}

/**
 * True when `existing` is the same machine as the catalog entry: identical after ignoring
 * case and punctuation, or the same machine words where the existing name has no brand
 * (the user typed it generically) or the same brand. A different brand is a different machine.
 */
export function isSameMachine(existing: string, catalogName: string): boolean {
  const a = parseName(existing)
  const b = parseName(catalogName)
  if (a.full === b.full) return true
  return a.core === b.core && (a.brand === undefined || a.brand === b.brand)
}

/** Keyword rules for guessing a muscle from a name. Order matters: first match wins. */
const RULES: [RegExp, MuscleGroup][] = [
  [/\b(?:adduct)/, 'adductors'],
  [/\b(?:abduct)/, 'abductors'],
  [/\b(?:leg curl|hamstring|glute|hip extension|deadlift)/, 'hamstrings'],
  [/\b(?:leg press|leg extension|squat|hack|lunge|step|quad)/, 'quads'],
  [/\b(?:abdominal|abs\b|ab\b|crunch|oblique|rotation|rotary|core)/, 'core'],
  [/\b(?:triceps|pushdown|dip|skull)/, 'triceps'],
  [/\b(?:bicep|curl)/, 'biceps'],
  [/\b(?:shoulder|lateral raise|deltoid|overhead|military)/, 'shoulders'],
  [/\b(?:chest|pec|fly|bench|incline|decline|press)/, 'chest'],
  [/\b(?:row|pulldown|pull down|pullover|lat\b|latissimus|chin|pull up|pull-up|back|torso arm|shrug|rear)/, 'back'],
]

/** Muscle for a name: the catalog's answer if it knows the machine, else a keyword guess. */
export function inferMuscle(name: string): MuscleGroup | undefined {
  const known = catalogMuscle(name)
  if (known) return known
  const n = name.toLowerCase()
  return RULES.find(([re]) => re.test(n))?.[1]
}

export const catalogKey = (name: string) => parseName(name).full

/**
 * Brings a library up to date: adds catalog machines it has never been offered (skipping
 * any it already has) and fills in missing muscle groups. Machines the user later removes
 * stay removed because their names are remembered in `catalogSynced`.
 */
export function syncCatalog<T extends { exercises: Exercise[]; catalogSynced?: string[] }>(
  data: T,
  newId: () => string,
): T {
  const synced = new Set(data.catalogSynced ?? [])
  const added: Exercise[] = []
  for (const item of CATALOG) {
    if (synced.has(catalogKey(item.name))) continue
    const have = [...data.exercises, ...added].some((e) => isSameMachine(e.name, item.name))
    if (!have) added.push({ id: newId(), name: item.name, muscle: item.muscle })
  }
  const exercises = [...data.exercises, ...added].map((e) =>
    e.muscle ? e : { ...e, ...(inferMuscle(e.name) ? { muscle: inferMuscle(e.name) } : {}) },
  )
  const catalogSynced = CATALOG.map((c) => catalogKey(c.name))
  const unchanged = added.length === 0 && exercises.every((e, i) => e === data.exercises[i])
  if (unchanged && catalogSynced.every((k) => synced.has(k))) return data
  return { ...data, exercises, catalogSynced }
}
