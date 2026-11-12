import Dexie from 'dexie'
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
    await first.sessions.add({ id: 'session', type: 'normal', startedAt: 1, items: [{ wordId: word.id, textSnapshot: word.text, result: 'wrong' }] })
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

it('v1 升级回填历史快照，删除词后历史仍可显示', async () => {
  const name = 'migration-' + crypto.randomUUID()
  const old = new Dexie(name)
  old.version(1).stores({ words: 'id, [language+text], source, createdAt', wordLists: 'id, name, createdAt, *wordIds', sessions: 'id, type, startedAt', wordStats: 'wordId, status, lastReviewedAt' })
  await old.table('words').add({ id: 'a', text: '花朵' })
  await old.table('sessions').add({ id: 's', items: [{ wordId: 'a', result: 'wrong' }, { wordId: 'deleted' }] })
  old.close()
  const db = new DangdangDB(name)
  const history = await db.sessions.get('s')
  expect(history?.items).toEqual([{ wordId: 'a', textSnapshot: '花朵', result: 'wrong' }, { wordId: 'deleted', textSnapshot: '', result: 'unwritten' }])
  expect(await db.words.get('a')).toMatchObject({ language: 'zh', autoPinyin: '', source: 'manual', createdAt: 0 })
  await db.words.delete('a')
  expect((await db.sessions.get('s'))?.items[0].textSnapshot).toBe('花朵')
  await db.words.bulkAdd([{ id: 'b', text: '重复', language: 'zh' }, { id: 'c', text: '重复', language: 'zh' }] as never[])
  expect(await db.words.count()).toBe(2)
  await db.delete()
})
