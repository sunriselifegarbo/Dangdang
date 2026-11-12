import { zh } from '../i18n/zh-CN'
import { loadSettings } from './settings'
let voices: SpeechSynthesisVoice[] = [], timer: ReturnType<typeof setTimeout> | undefined, generation=0
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
const refresh=()=>{voices=synth?.getVoices()??[]}
refresh();synth?.addEventListener('voiceschanged',refresh)
export const hasChineseVoice=()=>{refresh();return voices.some(v=>/^zh/i.test(v.lang))}
export function stopSpeaking(){generation++;if(timer)clearTimeout(timer);timer=undefined;synth?.cancel()}
export function speak(text:string,rate=loadSettings().rate,onEnd?:()=>void):boolean {
 if(!synth)return false
 stopSpeaking();refresh();const current=generation,settings=loadSettings();let count=0
 const chinese=voices.filter(v=>/^zh/i.test(v.lang)),selected=chinese.find(v=>v.localService&&/enhanced|premium|增强|高品质/i.test(v.name))??chinese.find(v=>v.localService&&/zh[-_]CN/i.test(v.lang))??chinese.find(v=>v.localService)??chinese[0]
 const play=()=>{if(current!==generation)return;const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=rate;if(selected)u.voice=selected
 u.onend=()=>{if(current!==generation)return;count++;if(count<settings.repeats)timer=setTimeout(play,settings.interval*1000);else onEnd?.()}
 u.onerror=()=>{if(current===generation)onEnd?.()};synth.speak(u)}
 play();return true
}
export function speechHint():string{return hasChineseVoice()?'':zh.voiceHelp}
