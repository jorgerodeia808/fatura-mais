// Gera ícones PWA simples usando apenas Node.js built-ins
// Cria um SVG e converte para um PNG placeholder usando sharp (se disponível)
// ou cria um arquivo SVG que pode ser usado diretamente

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const iconsDir = join(__dirname, '../public/icons')

mkdirSync(iconsDir, { recursive: true })

// SVG do ícone
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#0e4324"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" font-weight="bold"
        text-anchor="middle" fill="#f7f5f0">F</text>
  <text x="320" y="280" font-family="Arial, sans-serif" font-size="140" font-weight="bold"
        text-anchor="middle" fill="#977c30">+</text>
</svg>`

writeFileSync(join(iconsDir, 'icon.svg'), svgContent)
console.log('✓ SVG icon created at public/icons/icon.svg')
console.log('')
console.log('Para gerar os PNGs (icon-192.png e icon-512.png), usa:')
console.log('  npx sharp-cli --input public/icons/icon.svg --output public/icons/icon-192.png resize 192 192')
console.log('  npx sharp-cli --input public/icons/icon.svg --output public/icons/icon-512.png resize 512 512')
console.log('')
console.log('Ou usa https://realfavicongenerator.net para gerar todos os ícones de uma vez.')
