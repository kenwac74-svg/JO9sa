// 기존 세이브를 보존하고 RM 이식 검증용 복사본만 만든다. 시작 버튼에서 게임 자체 생성기를 사용한다.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),s=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const base=process.argv[2]||'G:/somi/JO9/game/save/7-1.sav',outDir=process.argv[3]||path.join(__dirname,'next-imports/saves');fs.mkdirSync(outDir,{recursive:true});
const raw=fs.readFileSync(base),baseHash=c.hash(raw);assert(s.serialize(s.parse(raw)).equals(raw));
const reports=[];
function make(name,title,configure,links){
 const d=s.parse(raw),changes=[];
 function set(name,num,str,key){const vs=d.vars.filter(v=>v.name===name.toUpperCase());if(!vs.length&&num===0&&str===undefined&&key===undefined)return;assert.equal(vs.length,1,'Missing or ambiguous '+name);const v=vs[0];let at=0;if(key!==undefined){const k=key.toUpperCase(),entry=v.idx.find(x=>x[1]===k);if(entry)at=entry[0];else{at=v.values.length;v.values.push(['0','']);v.idx.push([at,k]);v.idx.sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:0);}}if(!v.values.length)v.values.push(['0','']);const before=v.values[at].slice();if(num!==undefined)v.values[at][0]=String(num);if(str!==undefined)v.values[at][1]=str;changes.push({name,key,before,after:v.values[at].slice()});}
 set('ONGLOAD',undefined,'');set('MASTER_ENERGY',10);set('SNK_ROOM_TARGET',0);set('EXAM_IN_PROGRESS',0);set('LOST_QUEST_SLAVE',0);set('LOST_QUEST_SLAVE_JASMINE',0);set('TEMPORARY_CELL_STATE',0);
 configure(set,d);
 const boot="$ongload = '$ongload' & saved_game_loaded = 1 & snk_room_target = 0 & exam_in_progress = 0 & lost_quest_slave = 0 & lost_quest_slave_jasmine = 0 & temporary_cell_state = 0 & gs '#options' & SETTIMER 500 & ";
 const esc=x=>x.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const html=`<div style="position:absolute;left:20px;top:20px;width:730px;background:#eee4cd;color:#191919;padding:24px;font-size:19px"><h2>${title}</h2><p>테스트 전용 복사본입니다. 다시 불러오면 시작 상태로 돌아갑니다.<br>버튼을 눌러 현재 게임 코드로 테스트를 시작하세요.</p>`+links.map(([label,code])=>`<p><a style="color:#174b80" href="EXEC: ${esc(boot+code)}">${label}</a></p>`).join('')+'</div>';
 d.lines[4]=s.enc(-1);d.lines[5]=s.enc(-1);d.lines[8]=s.enc(html);d.lines[9]='';d.lines[10]=s.enc('main_screen');d.lines[15]=s.enc(0);
 const result=s.serialize(d),check=s.parse(result);assert(s.serialize(check).equals(result));assert.equal(check.lines[2],d.lines[2],'save CRC preserved');
 for(const v of check.vars){for(const [i]of v.idx)assert(i>=0&&i<v.values.length,'index bounds');}
 const changed=new Set(changes.map(x=>x.name)),prior=s.parse(raw);for(let i=0;i<d.vars.length;i++)if(!changed.has(d.vars[i].name))assert.deepEqual(d.vars[i],prior.vars[i]);
 const file=path.join(outDir,name+'.sav');assert(!fs.existsSync(file),'Do not overwrite test save '+file);fs.writeFileSync(file,result);
 reports.push({name,file,bytes:result.length,sha256:c.hash(result),changes,gameplayVerified:false});
}
const enter="dynamic $clear_slave_instance, 'slave' & slave_state = CONST_INT['no_slave'] & $place = 'smugglers_den' & sp_txt = 1 & interaction_city = 0 & copyarr '$display_options', '$smuggler_options' & gt 'shop_general'";
for(const [suffix,legacy,unique,title] of [['BEFORE',0,0,'베네라 구매 직전 — 20000$'],['AFTER',1,1,'베네라 구매 기록이 남은 상태 — 재구매 차단'],['LEGACY',1,0,'옛 세이브 구매 기록만 남은 상태 — 재구매 차단']]) {
 make('RM_TEST_VENERA_'+suffix,title,(set,d)=>{
  const quest=d.vars.find(v=>v.name==='QUEST').values[14][1];assert(quest,'quest14 binding');
  set('ACTIVE',1,undefined,quest);set('SPARKS',20000);set('VENERA',legacy);set('UNIQUE_SLAVE',unique,undefined,'venera');set('SLAVE_STATE',s.value(d,'CONST_INT','no_slave')[0]);
  set('COLOSSEUM_FIGHT',0);set('SKIP_TO',0);set('NOT_SAFE',0);set('SP_TXT',1);set('PLACE',undefined,'smugglers_den');
 },[['밀수업자 소굴 메뉴 열기 — 구매 전은 10000$ 메뉴 표시, 구매 기록이 있으면 미표시',enter]]);
}
assert.equal(c.hash(fs.readFileSync(base)),baseHash,'Original save unchanged');
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify({base,baseHash,qspHash:c.hash(fs.readFileSync('G:/somi/JO9/game/jack.qsp')),reports,limitations:['User gameplay verification pending.','AFTER and LEGACY are configured flag comparisons, not saves of an actual purchase.','Starting button clears the party only in these disposable test copies; original save is preserved.']},null,2));
console.log(reports.map(r=>({name:r.name,bytes:r.bytes,sha256:r.sha256})));
