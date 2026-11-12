import { db } from '../data/db'
import { planMerge, type Backup, type DataTables } from '../domain/backup'
async function readTables():Promise<DataTables>{const [words,wordLists,sessions,wordStats]=await Promise.all([db.words.toArray(),db.wordLists.toArray(),db.sessions.toArray(),db.wordStats.toArray()]);return {words,wordLists,sessions,wordStats}}
export async function exportBackup():Promise<Backup>{return db.transaction('r',db.tables,async()=>({formatVersion:1,exportedAt:Date.now(),...await readTables()}))}
export async function previewBackup(backup:Backup){return planMerge(backup,await readTables())}
export async function importBackup(backup:Backup){return db.transaction('rw',db.tables,async()=>{const plan=planMerge(backup,await readTables());await db.words.bulkAdd(plan.additions.words);await db.wordLists.bulkAdd(plan.additions.wordLists);await db.sessions.bulkAdd(plan.additions.sessions);await db.wordStats.bulkAdd(plan.additions.wordStats);return plan})}
