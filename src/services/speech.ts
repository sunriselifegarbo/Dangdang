import { zh } from '../i18n/zh-CN'
let voices: SpeechSynthesisVoice[] = []
const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
const refresh = () => { voices = synth?.getVoices() ?? [] }
refresh()
synth?.addEventListener('voiceschanged', refresh)
export const hasChineseVoice = () => { refresh(); return voices.some(v => /^zh/i.test(v.lang)) }
export function stopSpeaking() { synth?.cancel() }
export function speak(text: string, rate = 0.8, onEnd?: () => void): boolean {
  if (!synth) return false
  refresh(); synth.cancel()
  const chinese = voices.filter(v => /^zh/i.test(v.lang))
  const selected = chinese.find(v => /enhanced|premium|增强|高品质/i.test(v.name)) ?? chinese.find(v => /zh[-_]CN/i.test(v.lang)) ?? chinese[0]
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'; utterance.rate = rate
  if (selected) utterance.voice = selected
  utterance.onend = () => onEnd?.()
  utterance.onerror = () => onEnd?.()
  synth.speak(utterance)
  return true
}
export function speechHint(): string { return hasChineseVoice() ? '' : zh.voiceHelp }
