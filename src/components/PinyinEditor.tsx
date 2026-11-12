import { useState } from 'react'
import { db } from '../data/db'
import { automaticPinyin } from '../domain/words'
import { displayPinyin, type Word } from '../domain/models'
import { zh } from '../i18n/zh-CN'
export function PinyinEditor({ word, close, changed }: { word: Word; close: () => void; changed: (word: Word) => void }) {
  const [value, setValue] = useState(displayPinyin(word)), [error,setError] = useState(''), [busy,setBusy] = useState(false)
  async function save(restore: boolean) {
    setBusy(true)
    try { const next = { ...word, autoPinyin: automaticPinyin(word.text) }; if (restore) delete next.customPinyin; else next.customPinyin = value.trim(); await db.words.put(next); changed(next); close() } catch { setError(zh.error); setBusy(false) }
  }
  return <div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="pinyin-title"><h2 id="pinyin-title">{zh.editPinyin} · {word.text}</h2><p className="muted">{zh.pinyinHelp}</p><input autoFocus aria-label={zh.customPinyin} value={value} onChange={e => setValue(e.target.value)}/><div className="actions"><button disabled={busy || !value.trim()} className="primary" onClick={() => save(false)}>{zh.save}</button><button disabled={busy} onClick={() => save(true)}>{zh.restorePinyin}</button><button onClick={close}>{zh.cancel}</button></div><p role="alert">{error}</p></section></div>
}
