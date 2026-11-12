export interface OcrToken { text: string; x: number; y: number; width: number; height: number }
export function cleanOcrText(text: string): string[] {
  return [...new Set(text.match(/\p{Script=Han}+/gu) ?? [])]
}
export function processOcr(tokens: OcrToken[], fallback = ''): string[] {
  const han = tokens.filter(t => /\p{Script=Han}/u.test(t.text)).sort((a,b) => a.y - b.y || a.x - b.x)
  if (!han.length) return cleanOcrText(fallback)
  const rows: OcrToken[][] = []
  for (const token of han) {
    const row = rows.find(r => Math.abs(r[0].y - token.y) < Math.max(r[0].height, token.height) * .55)
    if (row) row.push(token); else rows.push([token])
  }
  const segments: { x: number; y: number; height: number; text: string }[] = []
  for (const row of rows) {
    row.sort((a,b) => a.x - b.x)
    let segment = { x: row[0].x, y: row[0].y, height: row[0].height, text: row[0].text }
    for (let i = 1; i < row.length; i++) {
      const current = row[i], previous = row[i-1], gap = current.x - previous.x - previous.width
      if (gap > Math.max(current.height,previous.height) * 2.5) { segments.push(segment); segment = { x: current.x, y: current.y, height: current.height, text: current.text } }
      else segment.text += (gap > current.height * .55 ? ' ' : '') + current.text
    }
    segments.push(segment)
  }
  const columns: typeof segments[] = []
  for (const segment of segments.sort((a,b) => a.x-b.x)) {
    const column = columns.find(c => Math.abs(c[0].x-segment.x) < Math.max(c[0].height,segment.height)*3)
    if (column) column.push(segment); else columns.push([segment])
  }
  return [...new Set(columns.sort((a,b) => a[0].x-b[0].x).flatMap(c => c.sort((a,b) => a.y-b.y).flatMap(s => cleanOcrText(s.text))))]
}
