import { useEffect, useState } from 'react'
import { db } from '../data/db'
import { displayPinyin, type SessionType, type Word, type WordStat, type WordStatus } from '../domain/models'
import { speak } from '../services/speech'
import { loadSettings } from '../services/settings'
import { zh } from '../i18n/zh-CN'
export function WordLibrary({ edit, refresh, start }: { edit: (word: Word) => void; refresh: number; start: (words: Word[], type: SessionType) => void }) {
  const [words,setWords] = useState<Word[]>([]), [stats,setStats] = useState<WordStat[]>([]), [tab,setTab] = useState<WordStatus>('unmastered'), [error,setError] = useState('')
  useEffect(() => { Promise.all([db.words.toArray(),db.wordStats.toArray()]).then(([w,s]) => {setWords(w);setStats(s)}).catch(() => setError(zh.error)) }, [refresh])
  const filtered = (status: WordStatus) => stats.filter(s => s.status===status).map(s => words.find(w => w.id===s.wordId)).filter((w):w is Word => !!w)
  function launch(status: WordStatus, type: SessionType) { const loaded=filtered(status); if (loaded.length) { speak(loaded[0].text,loadSettings().rate); start(loaded,type) } }
  return <><h1>{zh.nav.words}</h1><div className="actions">{Object.entries(zh.status).map(([key,label]) => <button key={key} aria-pressed={key===tab} onClick={() => setTab(key as WordStatus)}>{label}（{filtered(key as WordStatus).length}）</button>)}</div>
    <div className="actions"><button className="primary" disabled={!filtered('unmastered').length} onClick={() => launch('unmastered','wrong-retry')}>{zh.sessionType['wrong-retry']}</button><button disabled={!filtered('missed').length} onClick={() => launch('missed','missed-retry')}>{zh.sessionType['missed-retry']}</button><button disabled={!filtered(tab).length} onClick={() => launch(tab,'review')}>{zh.sessionType.review}</button></div>
    <section className="panel"><div className="actions">{filtered(tab).map(word => <button key={word.id} onClick={() => edit(word)}>{word.text}<small>{displayPinyin(word)}</small></button>)}</div>{!filtered(tab).length && <p className="muted">{zh.reviewEmpty}</p>}</section><p role="alert">{error}</p></>
}
