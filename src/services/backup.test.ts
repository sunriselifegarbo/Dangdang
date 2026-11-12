import { afterEach,expect,it } from 'vitest'
import { db } from '../data/db'
import { createWord,createSession,createSessionItem } from '../domain/models'
import { exportBackup,importBackup,previewBackup } from './backup'
afterEach(async()=>{await db.transaction('rw',db.tables,async()=>{for(const t of db.tables)await t.clear()})})
it('预览不写库，导入保留原 ID 与自定义拼音，不覆盖现有统计',async()=>{
 const word=createWord({text:'银行',autoPinyin:'yín háng',customPinyin:'手动'})
 await db.words.add(word)
 const backup=await exportBackup();expect(backup.words[0].id).toBe(word.id)
 const incoming={...backup,words:[{...word,id:'alias',customPinyin:'其他'}],sessions:[createSession([createSessionItem({...word,id:'alias'},'wrong')])]}
 const plan=await previewBackup(incoming);expect(plan.additions.words.length).toBe(0);expect(await db.sessions.count()).toBe(0)
 await importBackup(incoming);await importBackup(incoming)
 expect(await db.words.count()).toBe(1);expect((await db.words.get(word.id))?.customPinyin).toBe('手动');expect(await db.sessions.count()).toBe(1)
 expect((await db.sessions.toArray())[0].items[0].wordId).toBe(word.id)
})
