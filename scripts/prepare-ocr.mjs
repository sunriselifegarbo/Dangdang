import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
const require = createRequire(import.meta.url)
const target = 'public/ocr'
mkdirSync(target, { recursive: true })
const worker = dirname(require.resolve('tesseract.js/package.json'))
const core = dirname(require.resolve('tesseract.js-core/package.json'))
copyFileSync(join(worker, 'dist/worker.min.js'), join(target, 'worker.min.js'))
for (const type of ['lstm', 'simd-lstm', 'relaxedsimd-lstm']) copyFileSync(join(core, `tesseract-core-${type}.wasm.js`), join(target, `tesseract-core-${type}.wasm.js`))
copyFileSync(join(core, 'LICENSE'), join(target, 'LICENSE-core.txt'))
copyFileSync(join(worker, 'LICENSE.md'), join(target, 'LICENSE-tesseract.txt'))
