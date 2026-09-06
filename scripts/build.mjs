// dsh-app-dock — build. 宿主 esbuild 到 lib/，client 文本拼接注入。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { build } from 'esbuild'

mkdirSync('lib', { recursive: true })

await build({
  entryPoints: ['src/host/index.ts'],
  outdir: 'lib',
  bundle: false,
  format: 'esm',
  platform: 'node',
  target: 'node20',
})

const body = readFileSync('src/client/index.js', 'utf8')
const wrapped = `// dsh-app-dock — Client half (browser)。由 scripts/build.mjs 生成，请修改 src/client/index.js。
window.__ModuleLoader__.load({
  id: "dsh-app-dock",
  factory: (require) => {
${body}
    return { inject, apply }
  }
})
`
writeFileSync('lib/client.js', wrapped)