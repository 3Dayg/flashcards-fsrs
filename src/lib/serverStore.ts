import type { Flashcard, ReviewEvent } from '../types'
import { sql } from './sql'

type CardRow = { payload: Flashcard }
type ReviewRow = { payload: ReviewEvent }

export async function listCardsForOwner(
  ownerSub: string,
  stage: string,
): Promise<Flashcard[]> {
  const rows = await sql<CardRow>(
    `select payload
     from cards
     where owner_sub = $1 and stage = $2
     order by updated_at desc`,
    [ownerSub, stage],
  )
  return rows.map((row) => row.payload)
}

export async function getCardForOwner(
  ownerSub: string,
  stage: string,
  id: string,
): Promise<Flashcard | undefined> {
  const rows = await sql<CardRow>(
    `select payload
     from cards
     where owner_sub = $1 and stage = $2 and id = $3
     limit 1`,
    [ownerSub, stage, id],
  )
  return rows[0]?.payload
}

export async function upsertCardForOwner(
  ownerSub: string,
  stage: string,
  card: Flashcard,
): Promise<Flashcard> {
  await sql(
    `insert into cards (id, owner_sub, stage, payload, updated_at)
     values ($1, $2, $3, $4::jsonb, $5::timestamptz)
     on conflict (owner_sub, stage, id) do update set
       payload = excluded.payload,
       updated_at = excluded.updated_at`,
    [card.id, ownerSub, stage, JSON.stringify(card), card.updatedAt],
  )
  return card
}

export async function deleteCardForOwner(
  ownerSub: string,
  stage: string,
  id: string,
): Promise<boolean> {
  const existing = await getCardForOwner(ownerSub, stage, id)
  if (!existing) return false
  await sql(
    `delete from reviews
     where owner_sub = $1 and stage = $2 and card_id = $3`,
    [ownerSub, stage, id],
  )
  await sql(
    `delete from cards
     where owner_sub = $1 and stage = $2 and id = $3`,
    [ownerSub, stage, id],
  )
  return true
}

export async function countCardsForOwner(
  ownerSub: string,
  stage: string,
): Promise<number> {
  const rows = await sql<{ count: string | number }>(
    `select count(*)::int as count
     from cards
     where owner_sub = $1 and stage = $2`,
    [ownerSub, stage],
  )
  return Number(rows[0]?.count ?? 0)
}

export async function listReviewsForOwner(
  ownerSub: string,
  stage: string,
): Promise<ReviewEvent[]> {
  const rows = await sql<ReviewRow>(
    `select payload
     from reviews
     where owner_sub = $1 and stage = $2
     order by rated_at desc`,
    [ownerSub, stage],
  )
  return rows.map((row) => row.payload)
}

export async function addReviewForOwner(
  ownerSub: string,
  stage: string,
  event: ReviewEvent,
): Promise<ReviewEvent> {
  await sql(
    `insert into reviews (id, owner_sub, stage, card_id, session_id, payload, rated_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz)
     on conflict (owner_sub, stage, id) do update set
       card_id = excluded.card_id,
       session_id = excluded.session_id,
       payload = excluded.payload,
       rated_at = excluded.rated_at`,
    [
      event.id,
      ownerSub,
      stage,
      event.cardId,
      event.sessionId,
      JSON.stringify(event),
      event.ratedAt,
    ],
  )
  return event
}
