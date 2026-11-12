import { readdirSync, statSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
const files=[]
function walk(dir){for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isDirectory())walk(path);else files.push({path,size:statSync(path).size})}}
walk('dist');files.sort((a,b)=>b.size-a.size)
for(const file of files)if(file.size>=25*1024*1024)throw Error(`File exceeds 25MiB: ${file.path}`)
const manifest=JSON.parse(readFileSync('dist/manifest.webmanifest','utf8'))
if(manifest.start_url!=='/Dangdang/'||manifest.scope!=='/Dangdang/'||!manifest.icons.every(icon=>icon.src.startsWith('/Dangdang/')))throw Error('Invalid PWA base path')
for(const file of files.slice(0,5))console.log(`${file.path}: ${file.size} bytes (${(file.size/1024/1024).toFixed(2)} MiB)`)
