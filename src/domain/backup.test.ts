import { expect,it } from 'vitest'
import { parseBackup,planMerge,type Backup } from './backup'
import { createWord,createSession,createSessionItem,createWordList,createWordStat } from './models'
const empty={words:[],wordLists:[],sessions:[],wordStats:[]}
it('备份往返保留稳定 ID、快照和手动拼音',()=>{
 const word=createWord({text:'银行',autoPinyin:'yín háng',customPinyin:'自定义'})
 const backup:Backup={formatVersion:1,exportedAt:1,...empty,words:[word],sessions:[createSession([createSessionItem(word)])]}
 expect(parseBackup(JSON.stringify(backup))).toEqual(backup)
})
it('按 text+language 合并别名和引用，已有记录不覆盖，重复导入幂等',()=>{
 const word=createWord({text:'春天'}),alias={...word,id:'imported',customPinyin:'外部'}
 const list=createWordList('词单',[alias.id]),session=createSession([createSessionItem(alias,'wrong')])
 const current={...empty,words:[word],wordStats:[{...createWordStat(word.id),status:'mastered' as const}]}
 const backup:Backup={formatVersion:1,exportedAt:1,...empty,words:[alias],wordLists:[list],sessions:[session],wordStats:[createWordStat(alias.id)]}
 const plan=planMerge(backup,current)
 expect(plan.additions.words).toEqual([]);expect(plan.additions.wordLists[0].wordIds).toEqual([word.id]);expect(plan.additions.sessions[0].items[0].wordId).toBe(word.id);expect(plan.additions.wordStats).toEqual([])
 expect(current.words[0].customPinyin).toBeUndefined()
 expect(planMerge(backup,{words:current.words,wordStats:current.wordStats,wordLists:plan.additions.wordLists,sessions:plan.additions.sessions}).additions).toEqual(empty)
})
it('同文本不同语言不合并，缺省字段回填，非法数据拒绝',()=>{
 const word=createWord({text:'春天'})
 const raw={formatVersion:1,...empty,words:[{id:'a',text:'春天',language:'en'}]}
 expect(planMerge(parseBackup(JSON.stringify(raw)),{...empty,words:[word]}).additions.words[0].language).toBe('en')
 expect(()=>parseBackup('{')).toThrow();expect(()=>parseBackup(JSON.stringify({...raw,formatVersion:2}))).toThrow();expect(()=>parseBackup(JSON.stringify({...raw,words:[{id:'a',text:'春天',source:'bad'}]}))).toThrow()
})
