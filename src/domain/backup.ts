import { WORD_STATUS_PRIORITY } from './mastery'
import type { Session, SessionItem, Word, WordList, WordStat } from './models'
export interface Backup { formatVersion: 1; exportedAt: number; words: Word[]; wordLists: WordList[]; sessions: Session[]; wordStats: WordStat[] }
export type DataTables = Pick<Backup,'words'|'wordLists'|'sessions'|'wordStats'>
const object = (value: unknown): Record<string,unknown> => { if(!value || typeof value!=='object' || Array.isArray(value)) throw Error('object');return value as Record<string,unknown> }
const string = (value: unknown, fallback?: string): string => { if(value===undefined && fallback!==undefined)return fallback;if(typeof value!=='string')throw Error('string');return value }
const id = (value:unknown): string => {const result=string(value);if(!result || result.length>200)throw Error('id');return result}
const number = (value:unknown,fallback=0): number => { if(value===undefined)return fallback;if(typeof value!=='number' || !Number.isFinite(value) || value<0)throw Error('number');return value }
const array = (value:unknown): unknown[] => {if(!Array.isArray(value))throw Error('array');return value}
function enumeration<T extends string>(value: unknown, values: readonly T[], fallback: T): T { if(value===undefined)return fallback;if(!values.includes(value as T))throw Error('enum');return value as T }
function unique<T>(values:T[],key:(item:T)=>string):T[]{const seen=new Set<string>();for(const item of values){const k=key(item);if(seen.has(k))throw Error('duplicate-id');seen.add(k)}return values}
export function parseBackup(json: string): Backup {
  const raw=object(JSON.parse(json));if(raw.formatVersion!==1)throw Error('version')
  const words=unique(array(raw.words).map(value=>{const w=object(value);return {id:id(w.id),text:string(w.text),autoPinyin:string(w.autoPinyin,''),...(w.customPinyin!==undefined?{customPinyin:string(w.customPinyin)}:{}),source:enumeration(w.source,['manual','voice','photo'],'manual'),language:string(w.language,'zh'),createdAt:number(w.createdAt)} as Word}),w=>w.id)
  const wordLists=unique(array(raw.wordLists).map(value=>{const l=object(value);return {id:id(l.id),name:string(l.name),wordIds:array(l.wordIds??[]).map(id),createdAt:number(l.createdAt)}}),l=>l.id)
  const sessions=unique(array(raw.sessions).map(value=>{const s=object(value);return {id:id(s.id),type:enumeration(s.type,['normal','wrong-retry','missed-retry','review'],'normal'),startedAt:number(s.startedAt),items:array(s.items??[]).map(value=>{const i=object(value);return {wordId:id(i.wordId),textSnapshot:string(i.textSnapshot,words.find(w=>w.id===i.wordId)?.text??''),result:enumeration(i.result,['correct','wrong','unwritten'],'unwritten')} as SessionItem})} as Session}),s=>s.id)
  const wordStats=unique(array(raw.wordStats).map(value=>{const s=object(value);return {wordId:id(s.wordId),status:enumeration(s.status,['unmastered','missed','mastered'],'unmastered'),streak:number(s.streak),wrongCount:number(s.wrongCount),lastReviewedAt:s.lastReviewedAt===null || s.lastReviewedAt===undefined?null:number(s.lastReviewedAt)} as WordStat}),s=>s.wordId)
  return {formatVersion:1,exportedAt:number(raw.exportedAt),words,wordLists,sessions,wordStats}
}
export function planMerge(incoming: Backup, current: DataTables) {
  const additions:DataTables={words:[],wordLists:[],sessions:[],wordStats:[]}, aliases=new Map<string,string>()
  const byId=new Map(current.words.map(w=>[w.id,w])), byText=new Map(current.words.map(w=>[JSON.stringify([w.text,w.language]),w.id]))
  let conflicts=0
  for(const word of incoming.words){
    if(byId.has(word.id)){aliases.set(word.id,word.id);conflicts++;continue}
    const key=JSON.stringify([word.text,word.language]),existing=byText.get(key)
    if(existing){aliases.set(word.id,existing);conflicts++;continue}
    additions.words.push(word);byId.set(word.id,word);byText.set(key,word.id);aliases.set(word.id,word.id)
  }
  const mapId=(id:string)=>aliases.get(id)??id
  const listIds=new Set(current.wordLists.map(l=>l.id))
  for(const list of incoming.wordLists){if(listIds.has(list.id)){conflicts++;continue}additions.wordLists.push({...list,wordIds:[...new Set(list.wordIds.map(mapId))].filter(id=>byId.has(id))});listIds.add(list.id)}
  const sessionIds=new Set(current.sessions.map(s=>s.id))
  for(const session of incoming.sessions){if(sessionIds.has(session.id)){conflicts++;continue}additions.sessions.push({...session,items:session.items.map(item=>({...item,wordId:mapId(item.wordId)}))});sessionIds.add(session.id)}
  const statIds=new Set(current.wordStats.map(s=>s.wordId)),priority=WORD_STATUS_PRIORITY
  for(const stat of [...incoming.wordStats].sort((a,b)=>priority[b.status]-priority[a.status])){const wordId=mapId(stat.wordId);if(statIds.has(wordId)||!byId.has(wordId)){conflicts++;continue}additions.wordStats.push({...stat,wordId});statIds.add(wordId)}
  return {additions,conflicts}
}
