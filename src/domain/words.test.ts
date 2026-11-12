import { expect, it } from 'vitest'
import { automaticPinyin, splitWords } from './words'
it('空白与中英文标点切词，去重并保持顺序', () => {
  expect(splitWords(' 春天，花朵\n春天、阳光。大地！\t花朵;雨水 ')).toEqual(['春天','花朵','阳光','大地','雨水'])
  expect(splitWords(' ，\n。')).toEqual([])
})
it('拼音带声调且逐字分隔', () => expect(automaticPinyin('春天')).toBe('chūn tiān'))
