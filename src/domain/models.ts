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
export interface SessionItem { wordId: string; result: ItemResult }
export interface Session { id: string; type: SessionType; startedAt: number; items: SessionItem[] }
export interface WordStat {
  wordId: string
  status: WordStatus
  streak: number
  wrongCount: number
  lastReviewedAt: number | null
}
export const displayPinyin = (word: Word): string => word.customPinyin ?? word.autoPinyin
export function createWord(input: Pick<Word, 'text' | 'autoPinyin' | 'source'>): Word {
  return { ...input, id: crypto.randomUUID(), language: 'zh', createdAt: Date.now() }
}
