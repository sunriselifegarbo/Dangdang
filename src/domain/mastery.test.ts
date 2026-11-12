import { describe, expect, it } from 'vitest'
import { updateWordStat } from './mastery'
import { displayPinyin, createWord, type WordStat } from './models'
const initial: WordStat = { wordId: 'a', status: 'unmastered', streak: 0, wrongCount: 0, lastReviewedAt: null }
describe('掌握规则', () => {
  it('复习连续三次正确后掌握，错误后回退', () => {
    let stat = initial
    for (let i = 1; i <= 3; i++) {
      stat = updateWordStat(stat, 'correct', 'review', i)
      expect(stat.status).toBe(i === 3 ? 'mastered' : 'unmastered')
    }
    expect(updateWordStat(stat, 'wrong', 'normal', 4)).toMatchObject({ status: 'unmastered', streak: 0, wrongCount: 1 })
  })
  it('未听写标记错过，不计错误或复习时间', () => {
    expect(updateWordStat(initial, 'unwritten', 'normal', 5)).toEqual({ ...initial, status: 'missed' })
  })
  it('普通听写正确不累计复习次数，可配置门槛', () => {
    expect(updateWordStat(initial, 'correct', 'normal', 1).streak).toBe(0)
    expect(updateWordStat(initial, 'correct', 'missed-retry', 1, 1).status).toBe('mastered')
  })
  it('错误打断连续正确，错过的词也能复习掌握', () => {
    const once = updateWordStat({ ...initial, status: 'missed' }, 'correct', 'missed-retry', 1)
    expect(once.streak).toBe(1)
    expect(updateWordStat(once, 'wrong', 'review', 2).streak).toBe(0)
    expect(updateWordStat(once, 'correct', 'review', 2, 2).status).toBe('mastered')
  })
  it('拒绝无效门槛', () => expect(() => updateWordStat(initial, 'correct', 'review', 0, 0)).toThrow(RangeError))
})
it('默认中文，并优先显示手动拼音（含空字符串）', () => {
  const word = createWord({ text: '春天', autoPinyin: 'chūn tiān', source: 'manual' })
  expect(word.language).toBe('zh')
  expect(displayPinyin(word)).toBe('chūn tiān')
  expect(displayPinyin({ ...word, customPinyin: 'chún tiān' })).toBe('chún tiān')
  expect(displayPinyin({ ...word, customPinyin: '' })).toBe('')
})
