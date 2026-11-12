import Dexie, { type Table } from 'dexie'
import type { Word, WordList, Session, WordStat } from '../domain/models'
export const DATABASE_VERSION = 1
export class DangdangDB extends Dexie {
  words!: Table<Word, string>
  wordLists!: Table<WordList, string>
  sessions!: Table<Session, string>
  wordStats!: Table<WordStat, string>
  constructor(name = 'Dangdang') {
    super(name)
    // 已发布版本不可修改；字段或索引变更通过 version(2).stores(...).upgrade(...) 迁移。
    this.version(DATABASE_VERSION).stores({
      words: 'id, [language+text], source, createdAt',
      wordLists: 'id, name, createdAt, *wordIds',
      sessions: 'id, type, startedAt',
      wordStats: 'wordId, status, lastReviewedAt',
    })
  }
}
export const db = new DangdangDB()
