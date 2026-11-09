import { countCards, createCard } from './db'
import { DEMO_CARDS } from './seedData'

export { DEMO_CARDS } from './seedData'

/** Seed a few demo cards the first time the library is empty. */
export async function seedDemoCardsIfEmpty(): Promise<boolean> {
  if ((await countCards()) > 0) return false
  for (const card of DEMO_CARDS) {
    await createCard(card)
  }
  return true
}
