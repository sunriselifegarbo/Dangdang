import { pinyin } from 'pinyin-pro'
export function splitWords(text: string): string[] {
  return [...new Set(text.split(/[\s，,、。！？!?；;：:「」『』“”"（）()【】\[\]…·]+/u).map(x => x.trim()).filter(Boolean))]
}
export function automaticPinyin(text: string): string { return pinyin(text, { toneType: 'symbol', type: 'array' }).join(' ') }
