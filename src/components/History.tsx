import { useEffect, useState } from 'react'
import { db } from '../data/db'
import { type Session, type SessionType, type Word } from '../domain/models'
import { saveWords } from '../services/repository'
import { loadSettings } from '../services/settings'
import { speak } from '../services/speech'
import { zh } from '../i18n/zh-CN'
const date = (time: number) => new Intl.DateTimeFormat('zh-CN',{dateStyle:'medium',timeStyle:'short'}).format(time)
export function History({ start }: { start: (words: Word[], type: SessionType) => void }) {
  const [sessions,setSessions] = useState<Session[]>([]), [selected,setSelected] = useState<Session | null>(null), [error,setError] = useState(''), [busy,setBusy] = useState(false)
  useEffect(() => {db.sessions.orderBy('startedAt').reverse().toArray().then(setSessions).catch(() => setError(zh.error))},[])
  async function again(session: Session) {
    const texts=session.items.map(i => i.textSnapshot).filter(Boolean)
    if (!texts.length) return
    speak(texts[0],loadSettings().rate); setBusy(true)
    try { const words=await saveWords(texts); start(words,session.type) } catch {setError(zh.error);setBusy(false)}
  }
  return <><div className="section-heading"><h1>{selected ? zh.sessionType[selected.type] : zh.nav.history}</h1>{selected ? <button onClick={() => setSelected(null)}>{zh.back}</button> : <button disabled={!sessions.length} onClick={async () => { if(!confirm(zh.clearHistoryConfirm))return; try{await db.sessions.clear();setSessions([])}catch{setError(zh.error)} }}>{zh.clear}</button>}</div>
    {selected ? <><p className="muted">{date(selected.startedAt)}</p><div className="stats">{[[zh.total,selected.items.length],[zh.correct,selected.items.filter(i=>i.result==='correct').length],[zh.wrong,selected.items.filter(i=>i.result==='wrong').length]].map(([label,n])=><article key={label}><strong>{n}</strong><span>{label}</span></article>)}</div><section className="panel">{selected.items.map((item,index)=><div className="check-row" key={index}><strong>{item.textSnapshot || zh.historyMissing}</strong><span>{zh.result[item.result]}</span></div>)}<div className="actions"><button disabled={busy || !selected.items.some(i=>i.textSnapshot)} className="primary" onClick={()=>again(selected)}>{zh.again}</button></div></section></> : <section className="panel">{sessions.map(session=><button className="list-row" key={session.id} onClick={()=>setSelected(session)}><div>{zh.sessionType[session.type]}<small>{date(session.startedAt)}</small></div><span>{session.items.length} {zh.wordUnit} · {zh.correct} {session.items.filter(i=>i.result==='correct').length} · {zh.wrong} {session.items.filter(i=>i.result==='wrong').length}</span></button>)}{!sessions.length && <p className="muted empty">{zh.historyEmpty}</p>}</section>}<p role="alert">{error}</p></>
}
