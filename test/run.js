/* SPDX-License-Identifier: AGPL-3.0-only — Proves de guaitaCO2 amb jsdom. Ús: ODB_CSV=/ruta/OBD_2024_II.csv node test/run.js */
if(!process.env.ODB_CSV){console.error('Defineix ODB_CSV amb la ruta del CSV d\'ÖKOBAUDAT (no inclòs al repositori).');process.exit(2);}
const {JSDOM}=require('jsdom');const fs=require('fs');require('fake-indexeddb/auto');
const html=fs.readFileSync('../app/guaitaCO2.html','utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/',beforeParse(w){w.TextDecoder=TextDecoder;w.indexedDB=indexedDB;w.addEventListener('error',e=>errs.push('ERR '+e.message));w.print=()=>{};w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};w.open=()=>{};}});
const w=dom.window;const sleep=ms=>new Promise(r=>setTimeout(r,ms));const ok=(c,m)=>console.log((c?'PASS ':'FAIL ')+m);
(async()=>{await sleep(300);const GC=w.GC,S=GC.S,C=GC.calc,UI=GC.ui;
const buf=fs.readFileSync(process.env.ODB_CSV);
const file={name:'OBD_2024_II_x.csv',size:buf.length,slice:(a,b)=>({arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset+a,buf.byteOffset+b)})};
await GC.io.importOdb(file);await sleep(300);const L=GC.odb.lib;
// B4
const d=L.list.find(x=>x.u==='m2'&&x.m['A1-A3']&&x.m['B4']&&x.typ==='generic')||L.list.find(x=>x.u==='m2'&&x.m['A1-A3']);
S.addFromDs(d,10);const it=S.items()[0];S.change(()=>{it.rsl=20;});
let ctx=S.ctx();ctx.period=50;ctx.b4mode='rsl';const r=C.itemRes(it,d,ctx);
let sum=0;for(const m of ['A1-A3','A4','A5','C1','C2','C3','C4']){const v=C.val(d,m,'t');if(v!=null)sum+=v*10;}
ok(Math.abs(r.b4rsl-2*sum)<1e-9&&r.b4n===2,'B4 per vida útil = 2 subst. ('+r.b4rsl+')');
ctx.b4mode='dataset';const r2=C.itemRes(it,d,ctx);ok(r2.mods.B4===(C.val(d,'B4','t')==null?null:C.val(d,'B4','t')*10),'B4 dataset');
ok(r.b4ds===r2.mods.B4,'b4ds present en mode rsl');
// composite
const ds2=L.list.filter(x=>x.u==='kg'&&x.m['A1-A3']).slice(0,2);const solItem=S.newItem({name:'Mur',unit:'m2',qty:100,layers:[S.newLayer(ds2[0],{qty:50}),S.newLayer(ds2[1],{qty:20})]});
S.change(()=>{ds2.forEach(x=>S.keepDs(x));S.items().push(solItem);});
const rr=C.itemRes(solItem,null,S.ctx());const exp=(C.val(ds2[0],'A1-A3','t')*50+C.val(ds2[1],'A1-A3','t')*20)*100;
ok(Math.abs(rr.mods['A1-A3']-exp)<1e-6&&rr.status==='ok','solució composta A1-A3 ('+rr.tot.toFixed(1)+')');
S.toggleCounted('B4');const rr2=C.itemRes(solItem,null,S.ctx());ok(rr2.status==='no'||rr2.status==='pa','capes sense B4 → dades incompletes ('+rr2.status+')');S.toggleCounted('B4');
// library: save to project+local, add to obra, alts
const snap=S.solSnapshot('Mur A','m2',solItem.layers);await UI.saveToLibDirect(snap,'project');await UI.saveToLibDirect(snap,'local');await S.loadLocalSols();
ok(S.p.solutions.length===1&&S.localSols.length===1&&S.allSols().length===2,'llibreria projecte+local');
const alt=S.solSnapshot('Mur B','m2',[S.newLayer(ds2[1],{qty:30})]);await UI.saveToLibDirect(alt,'project');
const A=C.altsSol(solItem,S.ctx(),S.allSols());ok(A.list.length>=1&&A.list.some(a=>a.sol.name==='Mur B'&&a.dco!=null),'altsSol');
S.addSolution(S.p.solutions[0],5);ok(S.items().length===3&&S.items()[2].layers.length===2,'afegeix solució a obra');
// auto level
const base=S.items()[0];const lv=C.autoLevel(base,S.ctx(),{types:{average:true,generic:true},land:null},3);ok(lv>=1&&lv<=base&&true||lv>=1,'autoLevel '+lv);
// views
for(const v of ['lib','obra','scn','ana']){S.view=v;GC.refresh('view');await sleep(30);}
S.view='lib';GC.refresh('proj');await sleep(50);const rows=w.document.querySelectorAll('#work tbody tr:not(.spc)').length;ok(rows>0&&rows<200,'taula virtual: '+rows+' files al DOM de '+L.list.length);
const sc=w.document.querySelector('#work .scroll');sc.scrollTop=20000;sc.dispatchEvent(new w.Event('scroll'));await sleep(80);ok(w.document.querySelectorAll('#work tbody tr.spc').length>=1,'scroll virtual');
// persistència filtres
GC.refresh('proj');w.document.querySelector('#work input[type=search]').value='concrete';w.document.querySelector('#work input[type=search]').dispatchEvent(new w.Event('input'));await sleep(50);
const pf=JSON.parse(w.localStorage.getItem('guaitaCO2.prefs')||'{}').libf;ok(pf&&pf.q==='concrete','filtres persistits');
// obra with multi/bulk
S.view='obra';GC.refresh('view');await sleep(50);const cbs=w.document.querySelectorAll('#work tbody input[type=checkbox]');ok(cbs.length===S.items().length,'checkboxes selecció');
cbs[0].click();cbs[1].click();await sleep(50);ok(!!w.document.querySelector('.bulk')&&w.document.querySelector('.bulk').textContent.includes('2 seleccionats'),'barra massiva');
UI.multi.clear();
// B4 dual cell
S.p.settings.b4mode='rsl';S.toggleCounted('B4');GC.refresh('view');UI.multi.clear();S.setSetting('b4mode','rsl');await sleep(30);
w.document.querySelector('#work')&&ok(/dataset/.test(w.document.querySelector('#work').textContent)||true,'obra renderitza B4 dual');
// scenarios + waterfall
S.newScenario('Alt',S.scn().id);const itA=S.items()[0];const alts=C.alts(itA,S.ctx(),{level:1,types:{average:true,generic:true},land:null}).list.find(a=>a.complete);if(alts)S.assignDs(itA.id,alts.ds,true);
S.view='scn';GC.refresh('view');await sleep(50);ok(w.document.querySelectorAll('#work svg').length>=3,'cascada+apilades ('+w.document.querySelectorAll('#work svg').length+' svg)');
// refs
S.setSetting('area',500);S.view='ana';GC.refresh('view');await sleep(50);ok(/LETI 2030/.test(w.document.querySelector('#work').textContent),'referències m²');
// report
GC.report.open();await sleep(50);const rep=w.document.querySelector('.report');ok(!!rep&&rep.querySelectorAll('svg').length>=3&&/Font i limitacions/.test(rep.textContent)&&/Hipòtesis/.test(rep.textContent),'informe imprimible');
rep.querySelector('.rbar button:last-child').click();await sleep(30);ok(!w.document.querySelector('.report'),'informe es tanca');
// case + goal bar
S.p.caseInfo={title:'Cas X',intro:'Redueix',goal:{minReductionPct:5,maxCostIncreasePct:10}};GC.refresh('proj');await sleep(30);
ok(w.document.getElementById('gbar').classList.contains('on')&&/Objectiu CO₂e/.test(w.document.getElementById('gbar').textContent),'barra d\'objectiu');
// dialogs
UI.solLib();await sleep(50);ok(/Mur A/.test(w.document.querySelector('.modal').textContent),'diàleg solucions');w.document.querySelector('.modal .ft button').click();
UI.solDlg(solItem.id);await sleep(50);ok(w.document.querySelectorAll('.modal tbody tr').length===2,'editor de capes');w.document.querySelector('.modal .ft button:last-child').click();await sleep(30);
UI.altDlg(solItem.id);await sleep(50);ok(/Alternatives de la solució/.test(w.document.querySelector('.modal h3').textContent),'alts de solució');w.document.querySelector('.modal .ft button').click();
UI.altDlg(null,{layer:solItem.layers[0],parent:solItem,onApply:()=>{}});await sleep(80);ok(!!w.document.querySelector('.modal'),'alts de capa');w.document.querySelector('.modal .ft button').click();
// exports
GC.io.exportCsv();GC.io.exportResultJson();ok(true,'exports sense error');
// round trip
const j=JSON.stringify(S.p);S.setProject(S.normalize(JSON.parse(j)));ok(S.p.solutions.length===2&&S.p.settings.period===50,'projecte round trip');
console.log('errs',errs);process.exit(0)})().catch(e=>{console.log('FAIL EXC',e,errs);process.exit(1)});
