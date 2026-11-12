import { db } from '../data/db'
import { createWord, type Session, type Word, type WordSource } from '../domain/models'
import { automaticPinyin } from '../domain/words'
import { updateWordStat } from '../domain/mastery'
export async function saveWords(texts: string[], source: WordSource = 'manual'): Promise<Word[]> {
  return db.transaction('rw', db.words, async () => {
    const result: Word[] = []
    for (const text of texts) {
      let word = await db.words.where('[language+text]').equals(['zh', text]).first()
      if (!word) { word = createWord({ text, autoPinyin: automaticPinyin(text), source }); await db.words.add(word) }
      result.push(word)
    }
    return result
  })
}
export async function finishSession(session: Session, requiredStreak = 3): Promise<void> {
  await db.transaction('rw', db.sessions, db.wordStats, async () => {
    // 同一轮只提交一次，防止快速点击累计两次。
    if (await db.sessions.get(session.id)) return
    for (const item of session.items) {
      const previous = await db.wordStats.get(item.wordId)
      await db.wordStats.put(updateWordStat(previous, item.result, session.type, Date.now(), requiredStreak, item.wordId))
    }
    await db.sessions.add(session)
  })
}
