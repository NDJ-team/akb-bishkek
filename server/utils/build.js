/**
 * Сборка/минификация статики: npm run build
 *
 * Минифицирует JS (terser) и CSS (clean-css) из client/js и client/css
 * в папку client/dist. Сервер автоматически отдаёт файлы из client/dist,
 * если они существуют (см. server/app.js — статик отдаёт client с приоритетом dist).
 */
const fs = require('fs');
const path = require('path');
const terser = require('terser');
const CleanCSS = require('clean-css');

const CLIENT_DIR = path.join(__dirname, '..', '..', 'client');
const DIST_DIR = path.join(CLIENT_DIR, 'dist');
const JS_DIR = path.join(CLIENT_DIR, 'js');
const CSS_DIR = path.join(CLIENT_DIR, 'css');

if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

async function build() {
  console.log('— Минификация JS…');
  for (const file of fs.readdirSync(JS_DIR).filter((f) => f.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(JS_DIR, file), 'utf8');
    const out = await terser.minify(src, { compress: true, mangle: true });
    fs.writeFileSync(path.join(DIST_DIR, file), out.code);
    console.log(`  ✓ js/${file}`);
  }

  console.log('— Минификация CSS…');
  for (const file of fs.readdirSync(CSS_DIR).filter((f) => f.endsWith('.css'))) {
    const src = fs.readFileSync(path.join(CSS_DIR, file), 'utf8');
    const out = new CleanCSS({ level: 2 }).minify(src);
    fs.writeFileSync(path.join(DIST_DIR, file), out.styles);
    console.log(`  ✓ css/${file}`);
  }

  console.log('\nГотово. Минифицированные файлы: client/dist/');
}

build().catch((err) => {
  console.error('Ошибка сборки:', err);
  process.exit(1);
});
