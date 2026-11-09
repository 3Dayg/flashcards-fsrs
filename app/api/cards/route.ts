import { toFlashcard, type FlashcardInput } from '../../../src/lib/cardFactory'
import {
  errorJson,
  json,
  requireViewer,
} from '../../../src/lib/serverAuth'
import {
  countCardsForOwner,
  listCardsForOwner,
  upsertCardForOwner,
} from '../../../src/lib/serverStore'
import { DEMO_CARDS } from '../../../src/lib/seedData'

export const dynamic = 'force-dynamic'

async function seedIfEmpty(ownerSub: string, stage: string): Promise<void> {
  if ((await countCardsForOwner(ownerSub, stage)) > 0) return
  for (const input of DEMO_CARDS) {
    await upsertCardForOwner(ownerSub, stage, toFlashcard(input))
  }
}

export async function GET(request: Request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer

  try {
    await seedIfEmpty(viewer.ownerSub, viewer.stage)
    const cards = await listCardsForOwner(viewer.ownerSub, viewer.stage)
    return json(cards)
  } catch (error) {
    return errorJson(
      error instanceof Error ? error.message : 'Failed to list cards.',
      500,
    )
  }
}

export async function POST(request: Request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer

  try {
    const input = (await request.json()) as FlashcardInput
    const card = toFlashcard(input)
    await upsertCardForOwner(viewer.ownerSub, viewer.stage, card)
    return json(card, { status: 201 })
  } catch (error) {
    return errorJson(
      error instanceof Error ? error.message : 'Failed to create card.',
      400,
    )
  }
}
