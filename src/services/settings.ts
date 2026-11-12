export const defaultSettings = { showPinyin: true, autoSpeak: true, rate: 0.8, repeats: 1, interval: 1, requiredStreak: 3 }
export type Settings = typeof defaultSettings
export function loadSettings(): Settings {
  try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem('dangdang-settings') ?? '{}') } } catch { return { ...defaultSettings } }
}
export function saveSettings(settings: Settings) { localStorage.setItem('dangdang-settings', JSON.stringify(settings)) }
