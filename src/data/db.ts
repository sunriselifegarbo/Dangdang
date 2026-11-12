import Dexie, { type Table } from 'dexie'
import type { Word, WordList, Session, WordStat } from '../domain/models'
export const DATABASE_VERSION = 2
export class DangdangDB extends Dexie {
  words!: Table<Word, string>
  wordLists!: Table<WordList, string>
  sessions!: Table<Session, string>
  wordStats!: Table<WordStat, string>
  constructor(name = 'Dangdang') {
    super(name)
    // 已发布版本不可修改；字段或索引变更通过 version(2).stores(...).upgrade(...) 迁移。
    this.version(1).stores({
      words: 'id, [language+text], source, createdAt',
      wordLists: 'id, name, createdAt, *wordIds',
      sessions: 'id, type, startedAt',
      wordStats: 'wordId, status, lastReviewedAt',
    })
    this.version(2).stores({}).upgrade(async tx => {
      const words = new Map((await tx.table('words').toArray()).map(word => [word.id, word.text]))
      await tx.table('words').toCollection().modify(word => {
        word.language ??= 'zh'
        word.autoPinyin ??= ''
        word.source ??= 'manual'
        word.createdAt ??= 0
      })
      await tx.table('sessions').toCollection().modify(session => {
        session.type ??= 'normal'
        session.startedAt ??= 0
        session.items = (session.items ?? []).map((item: { wordId: string; textSnapshot?: string; result?: string }) => ({
          ...item, textSnapshot: item.textSnapshot ?? words.get(item.wordId) ?? '', result: item.result ?? 'unwritten',
        }))
      })
      await tx.table('wordLists').toCollection().modify(list => { list.wordIds ??= []; list.createdAt ??= 0 })
      await tx.table('wordStats').toCollection().modify(stat => {
        stat.status ??= 'unmastered'; stat.streak ??= 0; stat.wrongCount ??= 0; stat.lastReviewedAt ??= null
      })
    })
  }
}
export const db = new DangdangDB()
