import { afterEach, expect, it } from 'vitest'
import { db } from '../data/db'
import { createSession, createSessionItem } from '../domain/models'
import { finishSession, saveWords } from './repository'
afterEach(async () => { await db.transaction('rw', db.tables, async () => { for (const table of db.tables) await table.clear() }) })
it('按文本和语言复用词语，确认同一场次两次不重复累计', async () => {
  const [word] = await saveWords(['花朵'])
  expect((await saveWords(['花朵']))[0].id).toBe(word.id)
  const session = createSession([createSessionItem(word, 'wrong')])
  await finishSession(session); await finishSession(session)
  expect((await db.wordStats.get(word.id))?.wrongCount).toBe(1)
  expect((await db.sessions.get(session.id))?.items[0].textSnapshot).toBe('花朵')
})
it('未听写新词标记错过，普通正确不累计', async () => {
  const words = await saveWords(['花朵', '阳光'])
  await finishSession(createSession([createSessionItem(words[0]), createSessionItem(words[1], 'correct')]))
  expect((await db.wordStats.get(words[0].id))?.status).toBe('missed')
  expect((await db.wordStats.get(words[1].id))?.streak).toBe(0)
})
