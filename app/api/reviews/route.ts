import { createId } from '../../../src/lib/id'
import {
  errorJson,
  json,
  requireViewer,
} from '../../../src/lib/serverAuth'
import {
  addReviewForOwner,
  getCardForOwner,
  listReviewsForOwner,
} from '../../../src/lib/serverStore'
import type { ReviewEvent } from '../../../src/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer

  try {
    const reviews = await listReviewsForOwner(viewer.ownerSub, viewer.stage)
    return json(reviews)
  } catch (error) {
    return errorJson(
      error instanceof Error ? error.message : 'Failed to list reviews.',
      500,
    )
  }
}

export async function POST(request: Request) {
  const viewer = await requireViewer(request)
  if (viewer instanceof Response) return viewer

  try {
    const body = (await request.json()) as Partial<ReviewEvent>
    if (!body.cardId || !body.sessionId || !body.correctness || !body.difficulty) {
      return errorJson('Review payload is incomplete.', 400)
    }

    const card = await getCardForOwner(
      viewer.ownerSub,
      viewer.stage,
      body.cardId,
    )
    if (!card) return errorJson('Card not found.', 404)

    const event: ReviewEvent = {
      id: body.id?.trim() || createId('rev'),
      cardId: body.cardId,
      sessionId: body.sessionId,
      correctness: body.correctness,
      difficulty: body.difficulty,
      ratedAt: body.ratedAt ?? new Date().toISOString(),
    }
    await addReviewForOwner(viewer.ownerSub, viewer.stage, event)
    return json(event, { status: 201 })
  } catch (error) {
    return errorJson(
      error instanceof Error ? error.message : 'Failed to save review.',
      400,
    )
  }
}
