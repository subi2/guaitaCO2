# guaitaCO2

**CA** · Eina pedagògica i independent per comparar materials i solucions constructives pel seu CO₂e embegut (EN 15804+A2) amb dades d'ÖKOBAUDAT. Un sol fitxer HTML, tot al navegador.
**EN** · Independent educational tool to compare building materials and construction solutions by embodied CO₂e (EN 15804+A2) using ÖKOBAUDAT data. A single HTML file, all in the browser.

- Landing: [`pageCAT/index.html`](pageCAT/index.html) · [`pagesENG/index.html`](pagesENG/index.html)
- Ajuda / Help: [`pageCAT/ajuda.html`](pageCAT/ajuda.html) · [`pagesENG/help.html`](pagesENG/help.html)
- App: [`app/guaitaCO2.html`](app/guaitaCO2.html) (v0.2; interface in Catalan)

## Ús / Use
Obre `app/guaitaCO2.html`, descarrega el CSV d'ÖKOBAUDAT a <https://www.oekobaudat.de/en/service/downloads.html> i importa'l (Fitxer ▸ Importa).
Open `app/guaitaCO2.html`, download the ÖKOBAUDAT CSV from the link above and import it (Fitxer ▸ Importa).

GitHub Pages: Settings ▸ Pages ▸ Deploy from branch ▸ `main` / root.

## Desenvolupament / Development
```
npm install
npm run build                       # src/ -> app/guaitaCO2.html
ODB_CSV=/path/OBD_2024_II.csv npm test
```
El CSV d'ÖKOBAUDAT **no** s'inclou al repositori / The ÖKOBAUDAT CSV is **not** included in this repository.

## Legal
- Programari / Software: AGPL-3.0-only — see [LICENSE](LICENSE). © 2026 Jordi Subirós · SBS BiM Consulting.
- Dades / Data: ÖKOBAUDAT, BMWSB / BBSR. No redistribuïdes; condicions de redistribució no confirmades / not redistributed; redistribution terms unconfirmed.
- Eina indicativa i educativa; no és certificació, EPD ni ACV d'edifici / Indicative educational tool; not a certification, EPD or building LCA.
- Independent; no afiliada al BMWSB/BBSR, LETI ni RIBA / Not affiliated with BMWSB/BBSR, LETI or RIBA.

> Guaita Apps es distribueix «tal com és», sense cap garantia. Les eines estan pensades desde la recerca i com a suport tècnic i educatiu; la verificació dels resultats i la responsabilitat derivada del seu ús recauen únicament sobre l'usuari final.
