import {
  toFlashcard,
  type FlashcardInput,
} from '../../../../src/lib/cardFactory'
import {
  errorJson,
  json,
  requireViewer,
} from '../../../../src/lib/serverAuth'
import {
  deleteCardForOwner,
  getCardForOwner,
  upsertCardForOwner,
} from '../../../../src/lib/serverStore'
import type { Flashcard } from '../../../../src/types'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer

  const { id } = await context.params

  try {
    const owned = await getCardForOwner(viewer.ownerSub, viewer.stage, id)
    if (!owned) return errorJson('Card not found.', 404)

    const body = (await request.json()) as
      | FlashcardInput
      | { card: Flashcard }

    const next =
      'card' in body && body.card
        ? { ...body.card, id, createdAt: owned.createdAt }
        : toFlashcard(body as FlashcardInput, owned)

    if ('card' in body && body.card && body.card.id !== id) {
      return errorJson('Card id mismatch.', 400)
    }

    await upsertCardForOwner(viewer.ownerSub, viewer.stage, next)
    return json(next)
  } catch (error) {
    return errorJson(
      error instanceof Error ? error.message : 'Failed to update card.',
      400,
    )
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer

  const { id } = await context.params
  try {
    const deleted = await deleteCardForOwner(
      viewer.ownerSub,
      viewer.stage,
      id,
    )
    if (!deleted) return errorJson('Card not found.', 404)
    return new Response(null, {
      status: 204,
      headers: { 'cache-control': 'private, no-store' },
    })
  } catch (error) {
    return errorJson(
      error instanceof Error ? error.message : 'Failed to delete card.',
      500,
    )
  }
}
