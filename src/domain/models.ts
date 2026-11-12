export type WordSource = 'manual' | 'voice' | 'photo'
export type SessionType = 'normal' | 'wrong-retry' | 'missed-retry' | 'review'
export type WordStatus = 'unmastered' | 'missed' | 'mastered'
export type ItemResult = 'correct' | 'wrong' | 'unwritten'
export interface Word {
  id: string
  text: string
  autoPinyin: string
  customPinyin?: string
  source: WordSource
  language: string
  createdAt: number
}
export interface WordList { id: string; name: string; wordIds: string[]; createdAt: number }
export interface SessionItem { wordId: string; textSnapshot: string; result: ItemResult }
export interface Session { id: string; type: SessionType; startedAt: number; items: SessionItem[] }
export interface WordStat {
  wordId: string
  status: WordStatus
  streak: number
  wrongCount: number
  lastReviewedAt: number | null
}
export const displayPinyin = (word: Word): string => word.customPinyin ?? word.autoPinyin
export function createWord(input: Pick<Word, 'text'> & Partial<Omit<Word, 'text'>>): Word {
  return { id: crypto.randomUUID(), autoPinyin: '', source: 'manual', language: 'zh', createdAt: Date.now(), ...input }
}
export function createWordStat(wordId: string): WordStat {
  return { wordId, status: 'unmastered', streak: 0, wrongCount: 0, lastReviewedAt: null }
}
export function createSessionItem(word: Word, result: ItemResult = 'unwritten'): SessionItem {
  return { wordId: word.id, textSnapshot: word.text, result }
}
export function createWordList(name: string, wordIds: string[] = []): WordList {
  return { id: crypto.randomUUID(), name, wordIds: [...wordIds], createdAt: Date.now() }
}
export function createSession(items: SessionItem[] = [], type: SessionType = 'normal'): Session {
  return { id: crypto.randomUUID(), type, startedAt: Date.now(), items: items.map(item => ({ ...item })) }
}
