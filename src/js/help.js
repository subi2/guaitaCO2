/* guaitaCO2 — ajuda, glossari, limitacions i enunciat de cas didàctic */
const HP = GC.help = {};

HP.html = () => `
<h2>Què és guaitaCO2</h2>
<p>Una eina independent i pedagògica per <b>escollir materials i solucions constructives també pel seu CO₂e embegut</b>, no només pel cost. Treballes amb una «obra» (llista d'elements amb quantitat), hi assignes datasets d'ÖKOBAUDAT i veus el resultat per mòdul del cicle de vida, els punts calents i l'efecte de substituir materials.</p>
<h2>Com es treballa</h2>
<ol>
<li><b>Biblioteca</b>: importa una vegada el CSV d'ÖKOBAUDAT (Fitxer ▸ Importa ÖKOBAUDAT). Queda desat al teu navegador.</li>
<li><b>Obra</b>: afegeix elements des de la biblioteca, a mà, des d'un CSV o des d'una selecció de guaitaPreus. Indica la quantitat i la unitat de l'element.</li>
<li><b>Mòduls comptats</b>: a la barra superior tria quines fases sumen al total (per defecte A1–A3). D es mostra sempre a part.</li>
<li><b>Alternatives</b> (icona ⇄ a cada fila): llista datasets de la mateixa unitat i categoria amb Δ CO₂e i Δ cost. El nivell de categoria es tria sol (el més específic amb almenys 3 alternatives) i el pots canviar.</li>
<li><b>Solucions per capes</b> (Edita ▸ Solucions per capes…): un mur, un forjat o una coberta com a llista de capes per m². Es poden desar al projecte o a la llibreria local del navegador i substituir per altres solucions o capa a capa.</li>
<li><b>Escenaris</b>: copia l'obra, fes-hi substitucions i compara'n els totals, amb una <b>cascada</b> element a element. <b>Anàlisi</b>: fases, grups, punts calents i referències per m².</li>
<li><b>Informe</b> (Fitxer ▸ Informe imprimible…): resum, fases, elements, escenaris, hipòtesis i font, llest per imprimir o desar com a PDF.</li>
</ol>
<h2>Els mòduls (EN 15978 / EN 15804+A2)</h2>
<table><tr><td><b>A1–A3</b></td><td>Producte: matèries primeres, transport a fàbrica, fabricació</td></tr>
<tr><td><b>A4–A5</b></td><td>Transport a obra i instal·lació</td></tr>
<tr><td><b>B1–B7</b></td><td>Ús: manteniment, reparació, substitució, rehabilitació, energia i aigua operatives</td></tr>
<tr><td><b>C1–C4</b></td><td>Final de vida: desconstrucció, transport, tractament, eliminació</td></tr>
<tr><td><b>D</b></td><td>Beneficis i càrregues fora dels límits del sistema (reutilització, recuperació, reciclatge). <b>No se suma</b> als altres mòduls.</td></tr></table>
<h2>Indicadors</h2>
<p>Tots en <b>kg CO₂e</b> (equivalents de CO₂). <b>GWP-total</b> = fòssil + biogènic + luluc. <i>Biogènic</i>: carboni emès o captat per biomassa (p. ex. fusta). <i>Luluc</i>: canvi d'ús del sòl. Pots canviar d'indicador a la barra superior.</p>
<h2>Regles que cal recordar</h2>
<ul>
<li><b>«·» (sense dada) no és zero.</b> Un mòdul no declarat no es pot comparar com si valgués 0. Els elements amb dades parcials s'avisen i el total és un mínim.</li>
<li><b>Compara per unitat funcional</b>, no per quilo de material: 1 m² de mur amb la mateixa prestació, no 1 kg de maó contra 1 kg de formigó.</li>
<li><b>Factor de conversió</b>: si l'element és en m³ i el dataset en kg, cal una densitat. L'eina proposa un factor a partir de les dades del dataset i l'has de revisar.</li>
<li><b>Variants d'escenari</b>: alguns mòduls (B, C, D) porten diverses variants. Per defecte s'usa la que no té escenari (o S0/S1); es pot canviar a l'element.</li>
<li><b>Tipus de dataset</b>: <i>mitjana</i> i <i>genèric</i> són valors sectorials; <i>específic</i> és d'un fabricant concret. No barregis sense saber-ho.</li>
<li><b>Vida útil i B4</b>: si un element té vida útil (anys), B4 es pot calcular com (⌈període/vida⌉−1) × (A1–A5 + C1–C4 declarats). A la barra superior tries si s'usa el B4 del dataset o el calculat; a l'obra es mostren els dos valors.</li>
<li><b>Referències per m²</b>: valors orientatius d'edifici complet (LETI, RIBA) amb la font citada; només comparables si comptes els mateixos mòduls.</li>
<li><b>Preu d'ombra del carboni</b> (€/t): opcional i buit per defecte. Si l'informes, es calcula «cost + CO₂e × preu». És un criteri de decisió, no un cost real.</li>
</ul>
<h2>Limitacions</h2>
<ul>
<li>ÖKOBAUDAT és una base alemanya: pot no reflectir mixos energètics ni transports de la Península. Útil per a ordres de magnitud i per a decisions relatives; no per certificar.</li>
<li>No substitueix una ACV d'edifici ni una EPD. L'ÖKOBAUDAT no està pensada per fer l'ACV d'un producte. No barregis dades d'A1–A3 amb mòduls d'una altra base.</li>
<li>Les dades queden al teu navegador; esborrar les dades del lloc les elimina. Desa el projecte en JSON per conservar-lo.</li>
</ul>
<h2>Font i llicència</h2>
<p>Dades: ÖKOBAUDAT, BMWSB / BBSR (<a class="ext" href="https://www.oekobaudat.de" target="_blank" rel="noopener noreferrer">oekobaudat.de</a>), d'ús gratuït citant la font. L'eina no inclou ni redistribueix les dades: cada usuari les descarrega i les importa. Programari: AGPL-3.0-only · © SBS BiM Consulting, Jordi Subirós.</p>
<h2>Atalls</h2>
<p>A l'obra, marca les caselles per fer <b>edicions massives</b> (grup, vida útil, preu, duplica, elimina); <code>Maj</code>+clic selecciona un interval. Els filtres de la biblioteca es recorden.</p>
<p><code>Ctrl+Z</code> / <code>Ctrl+Y</code> desfés i refés · <code>Ctrl+S</code> desa el projecte · <code>F1</code> aquesta ajuda · <code>Esc</code> tanca els diàlegs.</p>`;

HP.GLOSS = [['CO₂e', 'Equivalent de CO₂: suma de gasos d\'efecte hivernacle ponderats pel seu potencial d\'escalfament.'], ['GWP', 'Potencial d\'escalfament global, horitzó 100 anys.'],
  ['EPD / DAP', 'Declaració ambiental de producte, verificada per tercers (EN 15804).'], ['Unitat funcional', 'Quantitat de producte que compleix una funció definida; base de comparació.'],
  ['Hotspot', 'Punt calent: element que concentra bona part de l\'impacte.'], ['Preu d\'ombra', 'Valor monetari assignat a una tona de CO₂e per ponderar decisions.']];

HP.show = function () {
  const d = h('div', { class: 'helpdoc' }); d.innerHTML = HP.html();
  d.appendChild(h('h2', null, 'Glossari')); d.appendChild(h('table', null, HP.GLOSS.map(g => h('tr', null, h('td', null, h('b', null, g[0])), h('td', null, g[1])))));
  return U.info('Ajuda · guaitaCO2 v.' + VERSION, d, { cls: 'wide' });
};

/* estat de l'objectiu d'un cas: l'escenari actiu es compara amb el primer escenari del projecte */
HP.goalStatus = function () {
  const ci = S.p && S.p.caseInfo; if (!ci || !ci.goal) return null; const res0 = S.res(S.p.scenarios[0]), res1 = S.res();
  const red = res0.total ? (res0.total - res1.total) / Math.abs(res0.total) * 100 : null;
  const dc = res0.costMiss === 0 && res1.costMiss === 0 && res0.cost ? (res1.cost - res0.cost) / res0.cost * 100 : null;
  const g = ci.goal; return { g, red, dc, base: S.p.scenarios[0].name, okR: g.minReductionPct == null ? null : (red != null && red >= g.minReductionPct), okC: g.maxCostIncreasePct == null ? null : (dc != null && dc <= g.maxCostIncreasePct) };
};
HP.showCase = function () {
  const ci = S.p && S.p.caseInfo; if (!ci) { U.info('Cas didàctic', 'Aquest projecte no té cap enunciat. Carrega un cas (JSON) o exporta\'n un des de Fitxer ▸ Exporta ▸ Cas didàctic.'); return; }
  const body = h('div', { class: 'helpdoc' }, h('p', { style: { whiteSpace: 'pre-wrap' } }, ci.intro || '(sense enunciat)')); const gs = HP.goalStatus();
  if (gs) {
    body.appendChild(h('h2', null, 'Objectiu'));
    body.appendChild(h('ul', null,
      gs.g.minReductionPct != null ? h('li', null, 'Reduir el CO₂e com a mínim un ' + gs.g.minReductionPct + ' % respecte a l\'escenari «' + gs.base + '». Ara: ' + (gs.red == null ? '—' : U.fmt(gs.red, 1) + ' %') + ' ' + (gs.okR ? '✔' : '✘')) : null,
      gs.g.maxCostIncreasePct != null ? h('li', null, 'Cost: com a màxim ' + gs.g.maxCostIncreasePct + ' % més. Ara: ' + (gs.dc == null ? 'cal preu a tots els elements' : U.fmtPct(gs.dc)) + ' ' + (gs.okC ? '✔' : '✘')) : null));
    body.appendChild(h('div', { class: 'hint' }, 'S\'avalua l\'escenari actiu contra el primer escenari del projecte.'));
  }
  return U.info(ci.title || 'Cas didàctic', body, { cls: 'wide' });
};
