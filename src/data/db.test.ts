import { expect, it } from 'vitest'
import { DangdangDB } from './db'
import { createWord } from '../domain/models'
it('版本 1 数据库可保存完整模型并在重开后读取', async () => {
  const name = 'test-' + crypto.randomUUID()
  const first = new DangdangDB(name)
  const word = createWord({ text: '花朵', autoPinyin: 'huā duǒ', source: 'manual' })
  await first.transaction('rw', first.tables, async () => {
    await first.words.add(word)
    await first.wordLists.add({ id: 'list', name: '测试', wordIds: [word.id], createdAt: 1 })
    await first.sessions.add({ id: 'session', type: 'normal', startedAt: 1, items: [{ wordId: word.id, result: 'wrong' }] })
    await first.wordStats.add({ wordId: word.id, status: 'unmastered', streak: 0, wrongCount: 1, lastReviewedAt: 1 })
  })
  first.close()
  const reopened = new DangdangDB(name)
  expect(await reopened.words.get(word.id)).toEqual(word)
  expect(await reopened.sessions.count()).toBe(1)
  expect(await reopened.wordLists.count()).toBe(1)
  expect(await reopened.wordStats.where('status').equals('unmastered').count()).toBe(1)
  await reopened.delete()
})
