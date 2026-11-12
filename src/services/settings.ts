export const defaultSettings = { showPinyin: true, autoSpeak: true, rate: 0.8, repeats: 1, interval: 1, requiredStreak: 3 }
export type Settings = typeof defaultSettings
export function normalizeSettings(value: unknown): Settings {
  const v=(value && typeof value==='object'?value:{}) as Partial<Settings>
  const bounded=(n:unknown,fallback:number,min:number,max:number,integer=false)=>typeof n==='number'&&Number.isFinite(n)?Math.min(max,Math.max(min,integer?Math.round(n):n)):fallback
  return {showPinyin:typeof v.showPinyin==='boolean'?v.showPinyin:true,autoSpeak:typeof v.autoSpeak==='boolean'?v.autoSpeak:true,rate:bounded(v.rate,.8,.5,1.2),repeats:bounded(v.repeats,1,1,5,true),interval:bounded(v.interval,1,.2,10),requiredStreak:bounded(v.requiredStreak,3,1,20,true)}
}
export function loadSettings(): Settings { try { return normalizeSettings(JSON.parse(localStorage.getItem('dangdang-settings') ?? '{}')) } catch { return {...defaultSettings} } }
export function saveSettings(settings: Settings) { localStorage.setItem('dangdang-settings', JSON.stringify(normalizeSettings(settings))) }
