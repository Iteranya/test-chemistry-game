/* Build elementary-dear-doodle-single.html — the whole game in one file.
 *   node tools/build-single.cjs
 * NOTE: replacements use FUNCTION replacers on purpose — string replacements
 * interpret '$$' as an escape for a single '$', which silently mangles any
 * double-dollar identifiers in the JS (this bit us once). */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const out = path.join(root, 'elementary-dear-doodle-single.html');

let html = read('index.html');
const css = read('css/style.css');
const lex = read('js/lexicon.js');
const eng = read('js/engine.js');
const app = read('js/app.js');

for (const [name, body] of [['js/lexicon.js', lex], ['js/engine.js', eng], ['js/app.js', app]]) {
  if (body.includes('</' + 'script>')) throw new Error('script close tag inside ' + name);
}
if (css.includes('</' + 'style>')) throw new Error('style close tag inside css');

html = html.replace(/<link rel="stylesheet" href="css\/style\.css">/,
  () => '<style>\n' + css + '\n</style>');
html = html.replace(/<script src="js\/lexicon\.js"><\/script>\s*<script src="js\/engine\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/,
  () => '<script>\n' + lex + '\n</script>\n<script>\n' + eng + '\n</script>\n<script>\n' + app + '\n</script>');

fs.writeFileSync(out, html);
console.log('Wrote', path.basename(out), fs.statSync(out).size, 'bytes');
