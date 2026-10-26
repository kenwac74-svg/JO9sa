'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
// Reproduces the executed diagnostic whose assumed scrollability check failed.
// This is preserved evidence, not an approved product acceptance condition.
const dir='G:/Codex/tmp/shop-text-quest-20261026/text/spacing/recheck/candidate';
const raw=fs.readFileSync(dir+'/gameover-candidate.qsp'),doc=c.parse(raw),start=doc.locations.find(l=>l.name==='Start');
let body=c.shift(doc.lines[start.body],5);
const literal=c.literals(body).find(e=>e.text.includes('var tries=0,snapshots=[];')&&e.text.startsWith('<script'));
assert(literal);let driver=literal.text;
function replaceOnce(oldText,newText){assert.equal(driver.split(oldText).length-1,1);driver=driver.replace(oldText,newText);}
replaceOnce('return {text:box.textContent,',"var menu=document.getElementById('jo9_gameover_menu'),oldScroll=box.scrollTop;box.scrollTop=1;var scrollWorks=box.scrollTop>0;box.scrollTop=oldScroll;return {overflowY:css.overflowY,scrollPossible:scrollWorks,verticalExcessMatchesBaseline:box.scrollHeight-box.clientHeight===14,menuNotOverlapped:!!menu&&bounds.bottom<=menu.getBoundingClientRect().top,menuBounds:menu?rect(menu.getBoundingClientRect()):null,text:box.textContent,");
replaceOnce('!last.verticalOverflow',"last.verticalExcessMatchesBaseline&&last.scrollPossible&&last.overflowY==='auto'&&last.menuNotOverlapped");
const name='gameover-final';
driver=driver.replaceAll('gameover-candidate',name).replaceAll('gameover_candidate',name.replaceAll('-','_'));
assert(!/[\r\n]/.test(driver),'QSP JavaScript must stay one physical line');
body=body.slice(0,literal.start)+driver.replaceAll(literal.quote,literal.quote+literal.quote)+body.slice(literal.end);
doc.lines[start.body]=c.shift(body,-5);
const bytes=c.serialize(doc);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));
const original=c.parse(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'));
for(let i=0;i<original.lines.length;i++)if(i!==start.body)assert.equal(doc.lines[i],original.lines[i]);
assert.equal(c.hash(fs.readFileSync(dir+'/content/js/jo9_word_wrap.js')),'fd5d5db466ca9851277c77af4c73398ca12f6e29a0efcb6d6c8a6730430bc237');
fs.writeFileSync(dir+'/'+name+'.qsp',bytes);
const plan=[{name,file:dir+'/'+name+'.qsp',marker:'JO9_QA_SPACING_'+name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Extra diagnostic assumption: existing14px scroll excess, assumed actual scrolling works, text/visible gaps/words/horizontal bounds normal, gameover menu not overlapped'}];
fs.writeFileSync(dir+'/plan-final-gameover.json',JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({startOnly:true,jsHash:c.hash(fs.readFileSync(dir+'/content/js/jo9_word_wrap.js')),plan:plan.map(p=>({name:p.name,marker:p.marker}))}));
