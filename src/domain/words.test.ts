import { expect, it } from 'vitest'
import { automaticPinyin, splitWords } from './words'
it('空白与中英文标点切词，去重并保持顺序', () => {
  expect(splitWords(' 春天，花朵\n春天、阳光。大地！\t花朵;雨水 ')).toEqual(['春天','花朵','阳光','大地','雨水'])
  expect(splitWords(' ，\n。')).toEqual([])
})
it('拼音带声调且逐字分隔', () => expect(automaticPinyin('春天')).toBe('chūn tiān'))
it('多音词词典优先，并允许手动覆盖与恢复自动', async () => {
  const { displayPinyin, createWord } = await import('./models')
  for (const [word, expected] of [['银行','yín háng'],['重复','chóng fù'],['长大','zhǎng dà'],['音乐','yīn yuè'],['好奇','hào qí'],['都市','dū shì'],['数学','shù xué']]) {
    expect(automaticPinyin(word)).toBe(expected)
    const stored = createWord({ text: word, autoPinyin: automaticPinyin(word), customPinyin: '自定义' })
    expect(displayPinyin(stored)).toBe('自定义')
    delete stored.customPinyin
    expect(displayPinyin(stored)).toBe(expected)
  }
})
