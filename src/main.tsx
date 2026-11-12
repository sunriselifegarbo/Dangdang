import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { db } from './data/db'
import { createSession, createSessionItem, createWordList, displayPinyin, type Session, type SessionType, type Word, type WordList } from './domain/models'
import { splitWords } from './domain/words'
import { finishSession, saveWords } from './services/repository'
import { speak, speechHint, stopSpeaking } from './services/speech'
import { readDraft, saveDraft } from './services/draft'
import { loadSettings, saveSettings, type Settings } from './services/settings'
import { zh } from './i18n/zh-CN'
import { PwaStatus } from './components/PwaStatus'
import { BackupPanel } from './components/BackupPanel'
import { History } from './components/History'
import { WordLibrary } from './components/WordLibrary'
import { OcrImport } from './components/OcrImport'
import { PinyinEditor } from './components/PinyinEditor'
import './style.css'

document.title = zh.appName
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { results: { [n: number]: { [n: number]: { transcript: string }; isFinal: boolean }; length: number }; resultIndex: number }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null }
function Home({ start, refresh, edit }: { start: (words: Word[]) => void; refresh: number; edit: (word: Word) => void }) {
  const [text, setText] = useState(() => readDraft().text), [name, setName] = useState(() => readDraft().name), [lists, setLists] = useState<WordList[]>([])
  const [counts, setCounts] = useState({ mastered: 0, missed: 0, unmastered: 0 }), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [listening, setListening] = useState(false)
  const [allWords,setAllWords] = useState<Word[]>([])
  const [ocr,setOcr] = useState(false)
  const sources = useRef(new Map<string, 'photo' | 'voice'>(readDraft().sources))
  useEffect(() => {saveDraft(text,name,[...sources.current])},[text,name])
  const recognition = useRef<Recognition | null>(null)
  const words = useMemo(() => splitWords(text), [text])
  const Constructor = (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition
  const standalone = matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
  const reload = async () => { setAllWords(await db.words.toArray()); setLists(await db.wordLists.orderBy('createdAt').reverse().toArray()); const stats = await db.wordStats.toArray(); setCounts({ mastered: stats.filter(s => s.status === 'mastered').length, missed: stats.filter(s => s.status === 'missed').length, unmastered: stats.filter(s => s.status === 'unmastered').length }) }
  useEffect(() => { reload().catch(() => setMessage(zh.error)) }, [refresh])
  useEffect(() => () => recognition.current?.stop(), [])
  async function run(action: () => Promise<void>) { setBusy(true); setMessage(''); try { await action() } catch { setMessage(zh.error) } finally { setBusy(false) } }
  function dictate() {
    if (listening) { recognition.current?.stop(); return }
    if (!Constructor) return
    const rec = new Constructor(); recognition.current = rec; rec.lang = 'zh-CN'; rec.continuous = false; rec.interimResults = false
    rec.onresult = e => { let extra = ''; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) extra += e.results[i][0].transcript + '\n'; splitWords(extra).forEach(text => sources.current.set(text,'voice')); setText(t => t + (t ? '\n' : '') + extra) }
    rec.onerror = () => { setMessage(zh.permissionDenied); setListening(false) }; rec.onend = () => setListening(false)
    try { rec.start(); setListening(true) } catch { setMessage(zh.permissionDenied) }
  }
  function launch() {
    // iOS：必须在点击调用栈内启动首词朗读，不能等 IndexedDB 后再播放。
    speak(words[0], loadSettings().rate)
    run(async () => start(await saveWords(words, text => sources.current.get(text) ?? 'manual')))
  }
  return <><h1>{zh.homeTitle}</h1><p className="muted">{zh.homeSubtitle}</p>
    <div className="stats">{Object.entries(zh.status).map(([key, label]) => <article key={key}><strong>{counts[key as keyof typeof counts]}</strong><span>{label}</span></article>)}</div>
    <div className="columns"><section className="panel"><h2>{zh.inputTitle}</h2><p className="muted">{zh.inputHint}</p>
      <textarea aria-label={zh.inputTitle} value={text} onChange={e => setText(e.target.value)} placeholder={zh.placeholder}/>
      <p className="muted small">{zh.keyboardHint}<br/>{zh.scanHint}</p>
      <div className="actions"><button className="primary grow" disabled={!words.length || busy} onClick={launch}>{zh.start}（{words.length} {zh.wordUnit}）</button>{Constructor && !standalone && <button onClick={dictate}>{listening ? zh.micStop : zh.mic}</button>}<button onClick={() => setOcr(true)}>{zh.photo}</button><button onClick={() => setText('')}>{zh.clear}</button></div>
      <div className="actions"><input aria-label={zh.listName} placeholder={zh.listName} value={name} onChange={e => setName(e.target.value)}/><button disabled={!name.trim() || !words.length || busy} onClick={() => run(async () => { const saved = await saveWords(words, text => sources.current.get(text) ?? 'manual'); await db.wordLists.add(createWordList(name.trim(), saved.map(w => w.id))); setName(''); await reload(); setMessage(zh.saved) })}>{zh.saveList}</button></div>
    </section><section className="panel"><h2>{zh.lists}</h2>{!lists.length ? <p className="empty muted">{zh.listEmpty}</p> : lists.map(list => <details key={list.id}><summary className="list-row">{list.name}<span>{list.wordIds.length} {zh.wordUnit}</span></summary><div className="actions"><button onClick={() => { const next = window.prompt(zh.renamePrompt,list.name); if (next?.trim()) run(async () => { await db.wordLists.update(list.id,{name:next.trim()}); await reload() }) }}>{zh.rename}</button><button onClick={() => { if(window.confirm(zh.deleteListConfirm)) run(async () => { await db.wordLists.delete(list.id); await reload() }) }}>{zh.delete}</button><button onClick={() => { const loaded = list.wordIds.map(id => allWords.find(w => w.id === id)).filter((w): w is Word => !!w); if (loaded.length) { speak(loaded[0].text, loadSettings().rate); start(loaded) } }}>{zh.start}</button>{list.wordIds.map(id => allWords.find(w => w.id === id)).filter((w): w is Word => !!w).map(word => <button key={word.id} onClick={() => edit(word)}>{word.text}<small>{displayPinyin(word)}</small></button>)}</div></details>)}</section></div>
    {ocr && <OcrImport close={() => setOcr(false)} saved={() => { reload().catch(() => setMessage(zh.error)) }} append={words => { words.forEach(text => sources.current.set(text,'photo')); setText(text => text + (text ? '\n' : '') + words.join('\n')) }}/>}<p role="status">{message}</p><p className="muted small"><NavLink to="/settings">{zh.backupHint}</NavLink></p></>
}
function Practice({ words, session, setSession, check, settings, edit }: { words: Word[]; session: Session; setSession: (s: Session) => void; check: () => void; settings: Settings; edit: (word: Word) => void }) {
  const [index, setIndex] = useState(0), [answer, setAnswer] = useState(false), [hint,setHint] = useState(speechHint)
  const navigate = useNavigate()
  useEffect(() => { const refresh = () => setHint(speechHint()); window.speechSynthesis?.addEventListener('voiceschanged',refresh); return () => window.speechSynthesis?.removeEventListener('voiceschanged',refresh) }, [])
  useEffect(() => { let lock: { release(): Promise<void> } | undefined; let active=true; const acquire = async () => { if (document.visibilityState !== 'visible') return; try { lock = await (navigator as Navigator & { wakeLock?: { request(type: string): Promise<{ release(): Promise<void> }> } }).wakeLock?.request('screen'); if(!active) await lock?.release() } catch { /* 不支持或系统低电量时仍可练习 */ } }; acquire(); document.addEventListener('visibilitychange', acquire); return () => { active=false; lock?.release().catch(() => {}); document.removeEventListener('visibilitychange', acquire); stopSpeaking() } }, [])
  function move(next: number) { setAnswer(false); setIndex(next); const items = session.items.map((item, i) => i === next && item.result === 'unwritten' ? { ...item, result: 'correct' as const } : item); setSession({ ...session, items }); if (settings.autoSpeak) speak(words[next].text, settings.rate) }
  function finish() { stopSpeaking(); check(); navigate('/check') }
  return <div className="practice"><div className="practice-top"><button onClick={() => { if (window.confirm(zh.leaveConfirm)) finish() }}>{zh.exit}</button><span>{index + 1} / {words.length}</span><button onClick={finish}>{zh.finish}</button></div>
    <div className="prompt"><strong>{settings.showPinyin ? displayPinyin(words[index]) : zh.hiddenPinyin}</strong>{answer && <p>{words[index].text}</p>}</div>
    {hint && <p className="muted small">{hint}</p>}<div className="actions"><button disabled={index === 0} onClick={() => move(index - 1)}>{zh.previous}</button><button onClick={() => speak(words[index].text, settings.rate)}>{zh.replay}</button><button onClick={() => setAnswer(!answer)}>{zh.reveal}</button><button onClick={() => edit(words[index])}>{zh.editPinyin}</button><button className="primary grow" onClick={() => index + 1 === words.length ? finish() : move(index + 1)}>{index + 1 === words.length ? zh.finish : zh.next}</button></div>
  </div>
}
function Check({ session, done, settings }: { session: Session; done: () => void; settings: Settings }) {
  const [items, setItems] = useState(session.items), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  return <><h1>{zh.checkTitle}</h1><p className="muted">{zh.checkHint}</p><div className="stats">{[[zh.total,items.length],[zh.correct,items.filter(i => i.result === 'correct').length],[zh.wrong,items.filter(i => i.result === 'wrong').length]].map(([label,n]) => <article key={label}><strong>{n}</strong><span>{label}</span></article>)}</div>
    <section className="panel">{items.map((item,index) => <div className="check-row" key={item.wordId}><strong>{item.textSnapshot}</strong><div className="actions">{Object.entries(zh.result).map(([key,label]) => <button aria-pressed={item.result === key} key={key} onClick={() => setItems(items.map((v,i) => i === index ? { ...v, result: key as typeof item.result } : v))}>{label}</button>)}</div></div>)}<button className="primary" disabled={busy} onClick={async () => { setBusy(true); try { await finishSession({ ...session, items }, settings.requiredStreak); done() } catch { setMessage(zh.error); setBusy(false) } }}>{zh.confirm}</button><p role="alert">{message}</p></section></>
}
function Preferences({ settings, change, changed }: { settings: Settings; change: (s: Settings) => void; changed: () => void }) {
  const [error,setError] = useState(''), [voiceHint,setVoiceHint] = useState(speechHint)
  useEffect(() => { const refresh = () => setVoiceHint(speechHint()); window.speechSynthesis?.addEventListener('voiceschanged',refresh); return () => window.speechSynthesis?.removeEventListener('voiceschanged',refresh) }, [])
  function update(next: Settings) { try { change(next); setError('') } catch {setError(zh.settingsError)} }
  return <><h1>{zh.nav.settings}</h1><section className="panel">{(['showPinyin','autoSpeak'] as const).map(key => <label className="setting" key={key}>{zh[key]}<input type="checkbox" checked={settings[key]} onChange={e => update({ ...settings, [key]: e.target.checked })}/></label>)}<label className="setting">{zh.rate}<input type="range" min="0.5" max="1.2" step="0.1" value={settings.rate} onChange={e => update({ ...settings, rate: +e.target.value })}/>{settings.rate}</label>
  {(['repeats','interval','requiredStreak'] as const).map(key=><label className="setting" key={key}>{zh[key]}<input type="number" inputMode={key==='interval'?'decimal':'numeric'} min={key==='interval'?.2:1} max={key==='repeats'?5:key==='interval'?10:20} step={key==='interval'?.2:1} value={settings[key]} onChange={e=>{const value=+e.target.value;if(value>0)update({...settings,[key]:value})}}/></label>)}
  <p className="muted">{voiceHint}</p><p role="alert">{error}</p></section><BackupPanel changed={changed}/></>
}
function App() {
  const [words, setWords] = useState<Word[]>([]), [session, setSession] = useState<Session | null>(null), [settings,setSettings] = useState(loadSettings), [refresh,setRefresh] = useState(0)
  const navigate = useNavigate()
  const [editing,setEditing] = useState<Word | null>(null)
  function start(loaded: Word[], type: SessionType = 'normal') { if (!loaded.length) return; setWords(loaded); const next = createSession(loaded.map(w => createSessionItem(w)), type); next.items[0].result = 'correct'; setSession(next); navigate('/practice') }
  function done() { setSession(null); setWords([]); setRefresh(v => v + 1); navigate('/') }
  return <div className="shell"><header><div className="brand"><span className="brand-mark" aria-hidden="true">✦</span>{zh.appName}</div><span className="muted privacy">{zh.local}</span></header>
    {!session && <nav>{Object.entries(zh.nav).map(([key,label]) => <NavLink key={key} to={key === 'home' ? '/' : '/' + key}>{label}</NavLink>)}</nav>}
    <PwaStatus busy={!!session}/><main><Routes><Route path="/" element={<Home start={start} refresh={refresh} edit={setEditing}/>}/><Route path="/practice" element={session ? <Practice words={words} session={session} setSession={setSession} check={() => {}} settings={settings} edit={setEditing}/> : <Home start={start} refresh={refresh} edit={setEditing}/>}/><Route path="/check" element={session ? <Check session={session} done={done} settings={settings}/> : <Home start={start} refresh={refresh} edit={setEditing}/>}/><Route path="/settings" element={<Preferences settings={settings} changed={() => setRefresh(v=>v+1)} change={s => { saveSettings(s); setSettings(loadSettings()) }}/>}/><Route path="/words" element={<WordLibrary edit={setEditing} refresh={refresh} start={start}/>}/><Route path="/history" element={<History start={start}/>}/><Route path="*" element={<Home start={start} refresh={refresh} edit={setEditing}/>}/></Routes></main>{editing && <PinyinEditor word={editing} close={() => setEditing(null)} changed={updated => { setWords(current => current.map(w => w.id === updated.id ? updated : w)); setRefresh(v => v + 1) }}/>}</div>
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><HashRouter><App/></HashRouter></React.StrictMode>)
