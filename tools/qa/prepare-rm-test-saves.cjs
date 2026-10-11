// 기존 세이브를 보존하고 RM 이식 검증용 복사본만 만든다. 시작 버튼에서 게임 자체 생성기를 사용한다.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),s=require('./save-codec.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
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
const prepCaroline="copyarr '$display_options', '$XXXTalesforest_options' & dynamic $clear_slave_instance, 'slave' & special_stock = 2613 & gs 'generate_stock' & gs 'stock_to_slave_nogt' & slave['brand'] = 0 & slave['beauty'] = 5 & slave['stamina'] = 4 & slave['temper'] = 4 & slave['intellect'] = 4 & slave['cook'] = 5 & slave['service'] = 5 & slave['expression'] = 4 & slave['calisthenics'] = 4 & slave['music'] = 4 & rating = 8 & interaction_city = 10372 & gt 'interaction_city'";
for(const stage of [8,9])make('RM_TEST_CHRISTMAS_STAGE'+stage,'크리스마스 진행 단계 '+stage,(set,d)=>{
 const key=s.value(d,'EVENT','спасение_рождества')[1];assert(key);set('ACTIVE',stage,undefined,key);set('SPARKS',20000);set('SLAVE_STATE',s.value(d,'CONST_INT','no_slave')[0]);
 for(const [key,value]of [['angry_goblins',2],['grinch',1],['mrs_santa_claus',1],['red_room',1],['shlyapkin',1]])set('NPC_PROGRESS',value,undefined,key);
},[['카롤라인을 조건에 맞게 준비하고 슐랴프킨에게 전달 시작',prepCaroline]]);
for(const owned of [0,1])make('RM_TEST_HOUSE_'+(owned?'AFTER':'BEFORE'),'주택 구매 '+(owned?'후':'직전'),(set,d)=>{
 set('ESTATE',undefined,'white_house');set('OWNER',0);set('SPARKS',owned?1:75*Number(s.value(d,'ESTATE_COST_MAIN','white_house')[0])+1);set('NOBLE_STATUS',1);set('NPC_PROGRESS',2,undefined,'pope');set('BRAND_REPUTATION',5);set('MASTER_CHA',5);set('MASTER_WEALTH',5);set('MASTER_WEALTH_TARGET',5);set('HOUSE_MESS',0);
},owned?[['구매 후 조건을 설정하고 기분 효과 확인 (소유권 1, 잔액 1$)',"owner = 1 & gs 'moodlets' & gt 'menu_form'"]]:[['현재 난이도의 구매가+1$를 준비하고 글로리아 구매 확인창으로',"gs '#estate_base' & copyarr '$display_options', '$realtor_options' & sparks = 75 * estate_cost_main[$estate] + 1 & owner = 0 & interaction_city = 1316 & gt 'interaction_city'"],['구매 전 기분 효과를 갱신하고 개인실로',"owner = 0 & gs 'moodlets' & gt 'menu_form'"]]);
assert.equal(c.hash(fs.readFileSync(base)),baseHash,'Original save unchanged');
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify({base,baseHash,qspHash:c.hash(fs.readFileSync('G:/somi/JO9/game/jack.qsp')),reports,limitations:['Load, rendering and event navigation require user testing.','Christmas slave preparation executes current game generator on start; original party is replaced only within test copy.','House AFTER is a configured comparison copy, not a gameplay-recorded purchase.']},null,2));console.log(reports.map(r=>({name:r.name,bytes:r.bytes})));
