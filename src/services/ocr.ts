import { createWorker, OEM, PSM, type Worker } from 'tesseract.js'
import { processOcr } from '../domain/ocr'
export interface OcrProvider {
  recognize(image: Blob, progress: (value: number) => void, signal: AbortSignal): Promise<string[]>
}
export class LocalOcrProvider implements OcrProvider {
  async recognize(image: Blob, progress: (value: number) => void, signal: AbortSignal): Promise<string[]> {
    let worker: Worker | undefined
    let cancelled = signal.aborted
    const cancel = () => { cancelled = true; worker?.terminate().catch(() => {}) }
    signal.addEventListener('abort', cancel, { once: true })
    try {
      if (cancelled) throw new DOMException('Cancelled', 'AbortError')
      const base = new URL(import.meta.env.BASE_URL + 'ocr/', location.origin).href
      worker = await createWorker('chi_sim', OEM.LSTM_ONLY, { workerPath: base + 'worker.min.js', corePath: base, langPath: base, workerBlobURL: false, cacheMethod: 'none', gzip: true, logger: m => { if (!cancelled) progress(m.status === 'recognizing text' ? .3 + m.progress * .7 : m.progress * .3) } })
      if (cancelled) throw new DOMException('Cancelled', 'AbortError')
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT })
      const result = await worker.recognize(image, {}, { text: true, blocks: true })
      if (cancelled) throw new DOMException('Cancelled', 'AbortError')
      const tokens = (result.data.blocks ?? []).flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words.map(w => ({ text: w.text, x: w.bbox.x0, y: w.bbox.y0, width: w.bbox.x1-w.bbox.x0, height: w.bbox.y1-w.bbox.y0 })))))
      progress(1)
      return processOcr(tokens, result.data.text)
    } finally { signal.removeEventListener('abort', cancel); await worker?.terminate().catch(() => {}) }
  }
}
export async function preprocessImage(url: string, crop: { left: number; top: number; right: number; bottom: number }): Promise<Blob> {
  const image = new Image(); image.src = url; await image.decode()
  const x = image.naturalWidth * crop.left / 100, y = image.naturalHeight * crop.top / 100
  const width = image.naturalWidth * (crop.right-crop.left)/100, height = image.naturalHeight * (crop.bottom-crop.top)/100
  const scale = Math.min(1,2000/Math.max(width,height)), canvas = document.createElement('canvas')
  canvas.width = Math.max(1,Math.round(width*scale)); canvas.height = Math.max(1,Math.round(height*scale))
  const context = canvas.getContext('2d')!
  context.drawImage(image,x,y,width,height,0,0,canvas.width,canvas.height)
  const pixels = context.getImageData(0,0,canvas.width,canvas.height)
  for (let i=0;i<pixels.data.length;i+=4) { const gray = pixels.data[i]*.299+pixels.data[i+1]*.587+pixels.data[i+2]*.114; const value = Math.max(0,Math.min(255,(gray-128)*1.35+128)); pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value }
  context.putImageData(pixels,0,0)
  return new Promise((resolve,reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('canvas')), 'image/png'))
}
