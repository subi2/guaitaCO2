#!/usr/bin/env node
/* guaitaCO2 — build: concatena fonts, CSS, HTML i JS a un únic fitxer HTML autònom. */
'use strict';
const fs = require('fs'), path = require('path');
const VER = '0.3';
const S = path.join(__dirname, 'src');
const rd = f => fs.readFileSync(path.join(S, f), 'utf8');
const JS = ['core.js', 'store.js', 'odb.js', 'calc.js', 'state.js', 'io.js', 'ui_lib.js', 'ui_obra.js', 'ui_alt.js', 'ui_scn.js', 'ui_ana.js', 'report.js', 'help.js', 'main.js'];
const fonts = rd('fonts.css').replace(/^\s*<style>/, '').trim();
const icon = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#0E1116"/><rect x="4" y="4" width="7" height="7" fill="#D6FB41"/><rect x="13" y="4" width="7" height="7" fill="#FF2ECC"/><rect x="4" y="13" width="7" height="7" fill="#00E5FF"/><rect x="13" y="13" width="7" height="7" fill="#FFE500"/></svg>');
const css = fonts + '\n' + rd('base1.css') + '\n' + rd('app.css');
const js = JS.map(f => '/* ===== ' + f + ' ===== */\n' + rd('js/' + f)).join('\n');
const body = rd('body.html').replace(/__VER__/g, VER);
const html = '<!DOCTYPE html>\n<html lang="ca"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">\n' +
  '<title>guaitaCO2 v.' + VER + '</title>\n<link rel="icon" type="image/svg+xml" href="' + icon + '">\n' +
  '<link rel="manifest" href="../manifest.webmanifest"><link rel="apple-touch-icon" href="../icons/icon-192.png"><meta name="theme-color" content="#0E1116">\n' +
  '<script>if("serviceWorker" in navigator&&location.protocol.indexOf("http")===0){navigator.serviceWorker.register("../sw.js").catch(function(){});}</script>\n' +
  '<!-- guaitaCO2 v.' + VER + ' — SBS BiM Consulting, Jordi Subirós — SPDX-License-Identifier: AGPL-3.0-only -->\n' +
  '<style>' + css + '</style></head><body>\n' + body +
  '<script>\n(function () {\n\'use strict\';\nconst VERSION = \'' + VER + '\';\n' + js + '\n})();\n</script></body></html>\n';
const out = process.argv[2] || path.join(__dirname, 'app', 'guaitaCO2.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log('OK', out, (html.length / 1024).toFixed(0) + ' KB');
