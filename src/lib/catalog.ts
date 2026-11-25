import type { Exercise, MuscleGroup } from './types'

export interface CatalogItem {
  name: string
  muscle: MuscleGroup
}

/** Known gym equipment. More gets added here as machines are photographed. */
export const CATALOG: CatalogItem[] = [
  { name: 'Adductor', muscle: 'adductors' },
  { name: 'Abductor', muscle: 'abductors' },
  { name: 'Abdominals', muscle: 'core' },
  { name: 'Incline Press', muscle: 'chest' },
  { name: 'Dual Cable Cross', muscle: 'chest' },
  { name: 'Pullover', muscle: 'back' },
  { name: 'Torso Arm - Sup.', muscle: 'back' },
  { name: 'Chin/Dip Assist', muscle: 'back' },
  { name: 'Lat Pulldown', muscle: 'back' },
  { name: 'High Row', muscle: 'back' },
  { name: 'Seated Row', muscle: 'back' },
  { name: 'Mid Row', muscle: 'back' },
  { name: 'Upper Back', muscle: 'back' },
  { name: 'Lateral Raise', muscle: 'shoulders' },
  { name: 'Shoulder Press', muscle: 'shoulders' },
  { name: 'Biceps Curl', muscle: 'biceps' },
  { name: 'Torso Rotation', muscle: 'core' },
  { name: 'Step', muscle: 'quads' },
  { name: 'Squat', muscle: 'quads' },
  { name: 'Belt Squat', muscle: 'quads' },
  { name: 'Hack Squat', muscle: 'quads' },
  { name: 'Leg Extension', muscle: 'quads' },
  { name: 'Leg Press', muscle: 'quads' },
  { name: 'Kneeling Leg Curl', muscle: 'hamstrings' },
  { name: 'Seated Leg Curl', muscle: 'hamstrings' },
  { name: 'Prone Leg Curl', muscle: 'hamstrings' },
]

/** Muscle the catalog lists for a machine, matched ignoring case, punctuation and brand words. */
export function catalogMuscle(name: string): MuscleGroup | undefined {
  const key = catalogKey(name)
  return CATALOG.find((c) => catalogKey(c.name) === key)?.muscle
}

/** Catalog entries whose name isn't already in the library (archived ones count as present). */
export function missingFromCatalog(existingNames: string[]): CatalogItem[] {
  return CATALOG.filter((c) => !existingNames.some((n) => isSameMachine(n, c.name)))
}

/** Maker and product-line words that are stripped from exercise names. */
const BRAND_WORDS = new Set([
  'life', 'fitness', 'lf', 'lifetime', 'hammer', 'strength', 'hoist', 'rocit', 'technogym', 'selection',
  'precor', 'freemotion', 'genesis', 'cybex', 'eagle', 'naut', 'nautilus', 'nitro', 'medx',
])

const isBrand = (word: string) => BRAND_WORDS.has(word.toLowerCase().replace(/[^a-z0-9]/g, ''))

/** Removes brand words: "Naut. Nitro Adductor" → "Adductor". Returns the name unchanged if nothing would be left. */
export function stripBrand(name: string): string {
  const kept = name.split(/\s+/).filter((w) => w && !isBrand(w))
  const stripped = kept.join(' ').replace(/^[-–:\s]+/, '')
  return stripped || name
}

/** Lowercased words of a name with brand words removed, for comparing machines. */
function parseName(name: string): { core: string } {
  const words = name.split(/\s+/).filter((w) => w && !isBrand(w))
  return { core: words.join(' ').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() }
}

/** Other names for the same exercise, mapped to the name they collapse into (all lowercase, brand-free). */
const ALIASES: Record<string, string> = {
  'seated leg press': 'leg press',
  'seated leg extension': 'leg extension',
  'seated chest press': 'chest press',
  'seated shoulder press': 'shoulder press',
  'arm curl': 'bicep curl',
  'lat pull down': 'lat pulldown',
  pulldown: 'lat pulldown',
  'lat machine': 'lat pulldown',
  'hip adduction': 'adductor',
  'hip adductor': 'adductor',
  'inner thigh': 'adductor',
  'hip abduction': 'abductor',
  'hip abductor': 'abductor',
  'outer thigh': 'abductor',
  abdominal: 'abdominals',
  abs: 'abdominals',
  'abdominal crunch': 'abdominals',
  'ab crunch': 'abdominals',
  'lying leg curl': 'prone leg curl',
  'rotary torso': 'torso rotation',
}

/**
 * Identity of an exercise: its name without brand words, case, punctuation or plurals,
 * with known alternate names folded together ("Seated Leg Press" and "Leg Press" match).
 */
export function exerciseKey(name: string): string {
  const core = parseName(name)
    .core.split(' ')
    .map((w) => (w === 'biceps' ? 'bicep' : w === 'triceps' ? 'tricep' : w))
    .join(' ')
  return ALIASES[core] ?? core
}

/** True when two names are the same exercise. */
export function isSameMachine(existing: string, catalogName: string): boolean {
  return exerciseKey(existing) === exerciseKey(catalogName)
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

export function catalogKey(name: string): string {
  return exerciseKey(name)
}

/**
 * Brings a library up to date: adds catalog machines it has never been offered (skipping
 * any it already has) and fills in missing muscle groups. Machines the user later removes
 * stay removed because their names are remembered in `catalogSynced`.
 */
export function syncCatalog<T extends { exercises: Exercise[]; catalogSynced?: string[]; brandsStripped?: boolean }>(
  data: T,
  newId: () => string,
): T {
  // Brand names are dropped once; after that, names are the user's to choose.
  const library = data.brandsStripped
    ? data.exercises
    : data.exercises.map((e) => (stripBrand(e.name) === e.name ? e : { ...e, name: stripBrand(e.name) }))
  const synced = new Set(data.catalogSynced ?? [])
  const added: Exercise[] = []
  for (const item of CATALOG) {
    if (synced.has(catalogKey(item.name))) continue
    const have = [...library, ...added].some((e) => isSameMachine(e.name, item.name))
    if (!have) added.push({ id: newId(), name: item.name, muscle: item.muscle })
  }
  const exercises = [...library, ...added].map((e) =>
    e.muscle ? e : { ...e, ...(inferMuscle(e.name) ? { muscle: inferMuscle(e.name) } : {}) },
  )
  const catalogSynced = CATALOG.map((c) => catalogKey(c.name))
  const unchanged = added.length === 0 && exercises.every((e, i) => e === data.exercises[i])
  if (unchanged && data.brandsStripped && catalogSynced.every((k) => synced.has(k))) return data
  return { ...data, exercises, catalogSynced, brandsStripped: true }
}
