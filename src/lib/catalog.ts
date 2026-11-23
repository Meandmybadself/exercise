import type { MuscleGroup } from './types'

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
]

const norm = (name: string) => name.trim().toLowerCase()
const byName = new Map(CATALOG.map((c) => [norm(c.name), c]))

export function catalogMuscle(name: string): MuscleGroup | undefined {
  return byName.get(norm(name))?.muscle
}

/** Catalog entries whose name isn't already in the library (archived ones count as present). */
export function missingFromCatalog(existingNames: string[]): CatalogItem[] {
  const have = new Set(existingNames.map(norm))
  return CATALOG.filter((c) => !have.has(norm(c.name)))
}
