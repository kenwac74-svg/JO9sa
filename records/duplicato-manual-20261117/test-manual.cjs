'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const {initQspEngine}=require('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/wasm-engine.cjs');
const file=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',raw=fs.readFileSync(file),doc=core.parse(raw),body=name=>core.shift(doc.lines[doc.locations.find(loc=>loc.name===name).body],5);
const options=body('#options'),interaction=body('interaction');
const index=options.indexOf('!spellbook'),end=options.indexOf('!own laboratory',index);assert(index>=0&&end>index);
let book=options.slice(index,end);const label=':jo9_duplicato_spellbook';if(!book.includes(label))book=label+'\r\n'+book;
const openStart=interaction.indexOf('if interaction = menu_spellbook:'),openEnd=interaction.indexOf('\r\nend',openStart)+5;assert(openStart>=0&&openEnd>openStart);
const helpStart=interaction.indexOf('! JO9 MOD START DUPLICATO_MANUAL_PAGE_20261117'),helpEnd=interaction.indexOf('! JO9 MOD END DUPLICATO_MANUAL_PAGE_20261117',helpStart);
const help=helpStart>=0?interaction.slice(helpStart,helpEnd):'';
const modeLine=options.split('\r\n').find(line=>line.includes("if $args[0] = 'jo9_duplicato_spellbook': jump"))||"if $args[0] = 'jo9_duplicato_spellbook': jump 'jo9_duplicato_spellbook'";
const fixtureBodies=new Map([['Start','exit'],['#options',modeLine+"\r\nqa_unrelated=999\r\n"+book+"\r\nqa_unrelated=1000"],['interaction',interaction.slice(openStart,openEnd)+'\r\n'+help],['shop_general',"$text_display=''\r\ndynamic $display_options[0]"],['$menu',body('$menu')]]);
const lines=['QSPGAME','','',core.shift(String(fixtureBodies.size),-5)];for(const [name,text]of fixtureBodies)lines.push(core.shift(name,-5),'',core.shift(text,-5),core.shift('0',-5));lines.push('');const fixture=Buffer.from(lines.join('\r\n'),'utf16le');
console.log=()=>{};
(async()=>{const api=await initQspEngine('G:/somi/JO9sa/tools/modding-hub/vendor/qsp/qsp-engine.wasm'),errors=[],checks=[];api.on('error',error=>errors.push(error));api.on('msg',(_text,done)=>done());for(const event of ['main_changed','stats_changed','actions_changed','objects_changed','timer','refresh','show_window','panel_visibility','close_file'])api.on(event,()=>{});api.openGame(fixture.buffer.slice(fixture.byteOffset,fixture.byteOffset+fixture.byteLength),true);
 const run=code=>{const before=errors.length;api.execCode(code.replace(/\r?\n/g,'\r\n'));assert.equal(errors.length,before,JSON.stringify(errors.slice(before)));};
 function check(name,fn){try{fn();checks.push({name,pass:true});}catch(error){checks.push({name,pass:false,error:error.message});}}
 check('opening cached manual adds one Duplicato link and uses the dedicated icon',()=>{
  run("killall\r\nqa_unrelated=37\r\nmenu_spellbook=83\r\nmenu_Backspellbook=6\r\nmenu_Basicsspellbook=71\r\nmenu_Auspexspellbook=72\r\n$spell_book[0]={*p 'cached old manual'}\r\ninteraction=83\r\ngs 'interaction'");
  const html=api.readVariable('$text_display');assert.equal((html.match(/듀플리카토 에센티아/g)||[]).length,1);assert(html.includes('Duplicato_Essentia.png'));assert(html.includes('62111'));assert.equal(Number(api.readVariable('qa_unrelated')),37);
  for(const existing of ['기초','아우스펙스','마그나 마그니피카','센텐티아 베리타스','뒤로','트레멘디오','리벨리스','불누스 사나레'])assert(html.includes(existing),existing);
 });
 check('the manual entry shows factual requirements and leaves spell progression unchanged',()=>{
  run("sparks=999\r\nmaster_energy=5\r\nnpc_progress['Priscilla_duplicato']=0\r\nalready_done_today['jo9_duplicato']=0\r\nslave['jo9_duplicato_received']=0\r\ninteraction=62111\r\ngs 'interaction'");
  assert.equal(Number(api.readVariable('txt_count')),2,'The manual uses the existing two-page help flow');
  const text=api.readVariable('$text',1)+api.readVariable('$text',2);for(const phrase of ['듀플리카토 에센티아','$900','B등급','각각 40','각각 행동력 1','하루에 한 번','평생 한 번','예민한 미각','상충하는 특성'])assert(text.includes(phrase),phrase);
  assert.equal(Number(api.readVariable('sparks')),999);assert.equal(Number(api.readVariable('master_energy')),5);assert.equal(Number(api.readVariableByKey('npc_progress','Priscilla_duplicato')),0);assert.equal(Number(api.readVariableByKey('already_done_today','jo9_duplicato')),0);assert.equal(Number(api.readVariableByKey('slave','jo9_duplicato_received')),0);assert.equal(api.readVariable('$return_lock'),'shop_general');
 });
 const result={phase:process.argv[2]?'GREEN':'RED',source:file,sha256:core.hash(raw),checks,passed:checks.filter(check=>check.pass).length,total:checks.length,errors,limits:['Executes the exact manual index block, entry branch, menu formatter, and help assignment in QSP WASM.','The full game EXE and visual layout were not opened.']};fs.writeFileSync(path.join(__dirname,result.phase.toLowerCase()+'.json'),JSON.stringify(result,null,2)+'\n');process.stdout.write(JSON.stringify({phase:result.phase,passed:result.passed,total:result.total,errors,failed:checks.filter(check=>!check.pass)})+'\n');if(result.passed!==result.total||errors.length)process.exitCode=1;
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
