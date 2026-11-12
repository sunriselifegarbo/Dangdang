import { useEffect, useRef, useState } from 'react'
import { zh } from '../i18n/zh-CN'
import { LocalOcrProvider, preprocessImage } from '../services/ocr'
import { cleanOcrText } from '../domain/ocr'
import { createWordList } from '../domain/models'
import { saveWords } from '../services/repository'
import { db } from '../data/db'
export function OcrImport({ close, append, saved }: { close: () => void; append: (words: string[]) => void; saved: () => void }) {
  const [image,setImage] = useState(''), [crop,setCrop] = useState({left:0,top:0,right:100,bottom:100}), [stage,setStage] = useState<'choose'|'crop'|'working'|'confirm'>('choose')
  const [rows,setRows] = useState<{id:string;text:string;selected:boolean}[]>([]), [progress,setProgress] = useState(0), [message,setMessage] = useState(''), [name,setName] = useState(''), [busy,setBusy] = useState(false)
  const abort = useRef<AbortController | null>(null), mounted = useRef(true)
  useEffect(() => { mounted.current=true; return () => { mounted.current=false; abort.current?.abort() } }, [])
  useEffect(() => () => { if(image) URL.revokeObjectURL(image) }, [image])
  function choose(file?: File) { if (!file) return; if (!file.type.startsWith('image/')) { setMessage(zh.photoError); return } setImage(URL.createObjectURL(file)); setStage('crop'); setMessage('') }
  async function recognize() {
    const controller = new AbortController(); abort.current=controller; setStage('working'); setProgress(0); setMessage('')
    try { const blob = await preprocessImage(image,crop); if (controller.signal.aborted) return; const words = await new LocalOcrProvider().recognize(blob,setProgress,controller.signal); if (!mounted.current || controller.signal.aborted) return; setRows(words.map(text => ({id:crypto.randomUUID(),text,selected:true}))); setStage('confirm'); if (!words.length) setMessage(zh.noOcrWords) }
    catch { if (mounted.current && !controller.signal.aborted) { setStage('crop'); setMessage(zh.photoError) } }
  }
  const selected = [...new Set(rows.filter(r => r.selected).flatMap(r => cleanOcrText(r.text)))]
  return <div className="overlay"><section className="dialog wide" role="dialog" aria-modal="true" aria-labelledby="ocr-title"><h2 id="ocr-title">{stage === 'confirm' ? zh.ocrConfirm : stage === 'working' ? zh.recognizing : zh.cropTitle}</h2>
    {(stage === 'choose' || stage === 'crop') && <><div className="actions"><label className="file-button">{zh.takePhoto}<input type="file" accept="image/*" capture="environment" onChange={e => choose(e.target.files?.[0])}/></label><label className="file-button">{zh.choosePhoto}<input type="file" accept="image/*" onChange={e => choose(e.target.files?.[0])}/></label></div>{image && <><p className="muted">{zh.cropHelp}</p><div className="crop-preview"><img src={image} alt={zh.imageAlt}/><div style={{left:crop.left+'%',top:crop.top+'%',right:(100-crop.right)+'%',bottom:(100-crop.bottom)+'%'}}/></div>{(['left','right','top','bottom'] as const).map(key => <label className="setting" key={key}>{zh[key]}<input type="range" min={0} max={100} value={crop[key]} onChange={e => setCrop(c => ({...c,[key]:+e.target.value}))}/>{crop[key]}%</label>)}<button className="primary" disabled={crop.left >= crop.right || crop.top >= crop.bottom} onClick={recognize}>{zh.recognize}</button></>}</>}
    {stage === 'working' && <><progress max={1} value={progress}/><p>{Math.round(progress*100)}%</p></>}
    {stage === 'confirm' && <><p className="muted">{zh.ocrHint}</p><div className="actions"><button onClick={() => setRows(rows.map(r => ({...r,selected:true})))}>{zh.selectAll}</button><button disabled={rows.filter(r => r.selected).length<2} onClick={() => { const chosen=rows.filter(r => r.selected); const first=chosen[0]; setRows(rows.flatMap(r => r.id===first.id ? [{...first,text:chosen.map(c => c.text).join('')}] : r.selected ? [] : [r])) }}>{zh.merge}</button></div>
      {rows.map(row => <div className="ocr-row" key={row.id}><input aria-label={zh.ocrSelection+' '+row.text} type="checkbox" checked={row.selected} onChange={e => setRows(rows.map(r => r.id===row.id ? {...r,selected:e.target.checked}:r))}/><input aria-label={zh.inputTitle} value={row.text} onChange={e => setRows(rows.map(r => r.id===row.id ? {...r,text:e.target.value}:r))}/><button onClick={() => setRows(rows.flatMap(r => r.id===row.id ? cleanOcrText(r.text).map(text => ({...r,id:crypto.randomUUID(),text})):[r]))}>{zh.split}</button><button onClick={() => setRows(rows.filter(r => r.id!==row.id))}>{zh.delete}</button></div>)}
      <div className="actions"><button className="primary" disabled={!selected.length || busy} onClick={() => { append(selected); close() }}>{zh.addToInput}（{selected.length}）</button><input aria-label={zh.listName} value={name} placeholder={zh.listName} onChange={e => setName(e.target.value)}/><button disabled={!name.trim() || !selected.length || busy} onClick={async () => { setBusy(true); try { const words=await saveWords(selected,'photo'); await db.wordLists.add(createWordList(name.trim(),words.map(w => w.id))); saved(); close() } catch {setMessage(zh.error);setBusy(false)} }}>{zh.saveList}</button></div></>}
    <p role="alert">{message}</p><button disabled={busy} onClick={() => {abort.current?.abort();close()}}>{zh.cancel}</button>
  </section></div>
}
