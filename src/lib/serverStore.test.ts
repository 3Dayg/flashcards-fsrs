import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./sql', async () => {
  const { PGlite } = await import('@electric-sql/pglite')
  const { readFile, readdir } = await import('node:fs/promises')
  const path = await import('node:path')

  let dbPromise: Promise<InstanceType<typeof PGlite>> | undefined

  async function getDb() {
    dbPromise ??= (async () => {
      const db = new PGlite()
      const migrationsDir = path.join(process.cwd(), 'migrations')
      const files = (await readdir(migrationsDir))
        .filter((f) => f.endsWith('.sql'))
        .sort()
      for (const file of files) {
        await db.exec(await readFile(path.join(migrationsDir, file), 'utf8'))
      }
      return db
    })()
    return dbPromise
  }

  return {
    sql: async <T = Record<string, unknown>>(
      text: string,
      params: unknown[] = [],
    ): Promise<T[]> => {
      const db = await getDb()
      return (await db.query<T>(text, params)).rows
    },
    __resetLocalDb: async () => {
      dbPromise = undefined
    },
  }
})

import { toFlashcard } from './cardFactory'
import {
  deleteCardForOwner,
  getCardForOwner,
  listCardsForOwner,
  upsertCardForOwner,
} from './serverStore'

describe('serverStore', () => {
  beforeEach(async () => {
    const sqlModule = await import('./sql')
    const reset = (
      sqlModule as unknown as { __resetLocalDb?: () => Promise<void> }
    ).__resetLocalDb
    if (reset) await reset()
  })

  it('keeps a created card for the same owner and stage', async () => {
    const card = toFlashcard({
      type: 'open',
      question: 'Survive redeploy?',
      answer: 'Yes',
      tags: ['persist'],
    })

    await upsertCardForOwner('user:test', 'production', card)
    const listed = await listCardsForOwner('user:test', 'production')
    expect(listed.map((item) => item.id)).toContain(card.id)
    expect(await getCardForOwner('user:test', 'production', card.id)).toMatchObject(
      {
        question: 'Survive redeploy?',
        answer: 'Yes',
      },
    )
  })

  it('isolates cards by owner and stage', async () => {
    const card = toFlashcard({
      type: 'open',
      question: 'Owner scoped?',
      answer: 'Yes',
      tags: ['persist'],
    })
    await upsertCardForOwner('user:a', 'production', card)

    expect(await listCardsForOwner('user:b', 'production')).toHaveLength(0)
    expect(await listCardsForOwner('user:a', 'preview')).toHaveLength(0)
    expect(await listCardsForOwner('user:a', 'production')).toHaveLength(1)
  })

  it('deletes only the owned card', async () => {
    const card = toFlashcard({
      type: 'open',
      question: 'Delete me',
      answer: 'Gone',
      tags: ['persist'],
    })
    await upsertCardForOwner('user:test', 'production', card)
    await expect(
      deleteCardForOwner('user:other', 'production', card.id),
    ).resolves.toBe(false)
    await expect(
      deleteCardForOwner('user:test', 'production', card.id),
    ).resolves.toBe(true)
    expect(await listCardsForOwner('user:test', 'production')).toHaveLength(0)
  })
})
