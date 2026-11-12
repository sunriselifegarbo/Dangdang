import { useEffect, useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import { zh } from '../i18n/zh-CN'
let available=false,ready=false,failed=false
const notify=()=>window.dispatchEvent(new Event('dangdang-pwa'))
const update=registerSW({
 onNeedRefresh(){available=true;notify()},
 onOfflineReady(){ready=true;notify()},
 onRegisterError(){failed=true;notify()},
 onRegisteredSW(_url,registration){if(registration?.active){ready=true;notify()}document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&navigator.onLine)registration?.update().catch(()=>{})})},
})
export function PwaStatus({busy}:{busy:boolean}){
 const [state,setState]=useState({available,ready,failed})
 useEffect(()=>{const handler=()=>setState({available,ready,failed});window.addEventListener('dangdang-pwa',handler);handler();return()=>window.removeEventListener('dangdang-pwa',handler)},[])
 if(import.meta.env.DEV)return null
 return <div className="pwa-status" role="status">{state.available?<button disabled={busy} onClick={()=>update(true)}>{busy?zh.updateAfterSession:zh.updateReady}</button>:<span>{state.ready?zh.offlineReady:state.failed?zh.offlineError:zh.offlinePreparing}</span>}</div>
}
