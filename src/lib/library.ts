import { syncCatalog } from './catalog'
import { dedupeLibrary } from './dedupe'
import type { AppData } from './types'

/** Brings stored or imported data up to date: merges duplicate exercises, then syncs the catalog. */
export function syncLibrary(data: AppData, newId: () => string): AppData {
  return syncCatalog(dedupeLibrary(data), newId)
}
