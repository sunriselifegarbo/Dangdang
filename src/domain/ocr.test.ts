import { expect, it } from 'vitest'
import { cleanOcrText, processOcr } from './ocr'
it('过滤拼音英文数字页码及标点，保留汉字词并去重', () => {
  expect(cleanOcrText('chūn tiān 春天、花朵\nhuā duǒ 12 Page 23\n春天 阳光。')).toEqual(['春天','花朵','阳光'])
})
it('多列课本按列再按行，过滤夹杂的拼音与页码', () => {
  const box = (text: string,x: number,y: number) => ({ text,x,y,width:40,height:20 })
  expect(processOcr([box('阳光',300,100),box('春天',20,10),box('雨水',300,10),box('花朵',20,100),box('huā duǒ',20,70),box('38',500,500),box('春天',20,200)])).toEqual(['春天','花朵','雨水','阳光'])
})
it('合并同一词的字框，并保留足够间隔的独立词', () => {
  expect(processOcr([{text:'春',x:0,y:0,width:20,height:20},{text:'天',x:21,y:0,width:20,height:20},{text:'花朵',x:60,y:0,width:40,height:20}])).toEqual(['春天','花朵'])
})
