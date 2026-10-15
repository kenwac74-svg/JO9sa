const fs=require('fs'),path=require('path'),assert=require('assert');
const s=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const base=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/save/hbe.sav';
const outDir=process.argv[3]||path.join(require('os').tmpdir(),'JO9-undiscovered-test-20261015');fs.mkdirSync(outDir,{recursive:true});
const raw=fs.readFileSync(base),d=s.parse(raw);assert(s.serialize(d).equals(raw));const before=c.hash(raw),changes=[];
function set(name,num,str){const v=d.vars.find(v=>v.name===name);if(!v)return;assert(v.values.length);const old=v.values[0].slice();if(num!==undefined)v.values[0][0]=String(num);if(str!==undefined)v.values[0][1]=str;changes.push({name,before:old,after:v.values[0].slice()});}
for(const name of ['ONGLOAD','ONNEWLOC','ONACTSEL','ONOBJSEL','COUNTER'])set(name,undefined,'');
for(const name of ['AUTOSAVE','DECADESAVE','AUTOSAVE_DAY','AUTOSAVE_DECADE'])set(name,0);
for(const type of [2001,2002]){const v=d.vars.find(v=>v.name==='SEED_AGE');assert.equal(+v.values[type][0],2,'Use mature adult presets, never relabel a youthful preset');}
const boot=["$ongload = '$ongload'","$onnewloc = '$newloc'","saved_game_loaded = 1","snk_room_target = 0","exam_in_progress = 0","lost_quest_slave = 0","lost_quest_slave_jasmine = 0","temporary_cell_state = 0","debug_interactions = 0","autosave = 0","decadesave = 0","autosave_day = 0","autosave_decade = 0","gs '#options'","gs 'refresh_database'","dynamic $clear_slave_instance, 'slave'","dynamic $clear_slave_instance, 'assistant'","slave_state = CONST_INT['no_slave']","assistant_state = CONST_INT['no_slave']"];
for(const role of ['slave','assistant','room1','room2','room3','room4']){
 if(role.startsWith('room'))boot.push("dynamic $clear_slave_instance, '"+role+"'",role+"_state = CONST_INT['no_slave']");
}
for(const seed of [2002,2001]){
 boot.push('cheat_h = 0','cheat_j = 0','cheat_k = 0','cheat_l = 0','special_stock = '+seed,"gs 'generate_stock'","stock['virginity'] = 0","gs 'stock_to_slave_nogt'");
 for(const [key,val]of Object.entries({virginity:0,jo9_meiki_initialized:0,jo9_meiki_checked:0,jo9_meiki_prev:0,jo9_meiki_known:0,pride:0,angst:0,fear:0,domini_dictum:0,neg_raped:0,neg_disgust:0,neg_slave:0,neg_pain:0,neg_shame:0,moral:5,rational:5,custom:5,stamina:5,energy:5,intellect:3,temper:3,mood:3,arousal:4,sub_vaginal:0,sub_threesome:0,sub_dp:0,sub_tp:0,sub_gangbang:0,sub_bukkake:0,sub_threesome_xp:0,sub_dp_xp:0,sub_tp_xp:0,sub_gangbang_xp:0,sub_bukkake_xp:0}))boot.push("slave['"+key+"'] = "+val);
 boot.push("slave_rate['moral'] = 0");
 if(seed===2002)boot.push("$slave_name = '성인 보조 B'","dynamic $swap_slave_instances, 'slave', 'assistant'");
 else boot.push("$slave_name = '미발견 테스트 A'");
}
boot.push("gs 'jo9_meiki_state', 'slave', 0","gs 'jo9_meiki_state', 'assistant', 0","master_energy = 10","master_excitement = 3","master_mood = 3","master_mood_rate = 0","master_penetration = 5","master_artdirector = 5","master_tutor = 5","master_moodlet['pos_new_slave'] = 5","is_home = 1","$place = 'bedroom'","$return_lock = 'main_screen'","menu_form = 1","SETTIMER 500","gt 'main_screen'");
const code=boot.join(' & '),esc=x=>x.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
assert(!code.includes("['virginity'] = 4"));assert(!code.includes("['jo9_meiki_known'] = 1"));assert(!code.includes('rand('));
const html='<div style="position:absolute;left:25px;top:25px;width:680px;padding:24px;background:#eee4cd;color:#222;font-size:19px"><h2>미발견부터 시작하는 플레이 테스트</h2><p>테스트 전용 복사본입니다. 시작 버튼이 기존 게임 생성기로 성인 프리셋 2001·2002를 준비합니다.<br>시작 상태는 0, 발견 이력 0, 판정 이력 0입니다.<br>실제 발견 확률은 5%이며 강제 발견이나 확률 변경은 없습니다.<br>발견 실패 시 이 세이브를 다시 불러오고 시작 버튼을 누르세요.<br>발견 후 기술 화면에서 S+ 1개·B+ 이상 5개를 확인하세요.<br>교육의 추가 누적 경험치는 지정한 5개 기술에 한해 회당 +1입니다.<br>자동저장은 이 복사본에서 껐습니다. 저장할 때는 별도 새 이름을 쓰세요.<br>원본 hbe는 바꾸지 않았으며, 버튼을 누르기 전에는 플레이용 준비가 끝나지 않은 상태입니다.</p><p><a style="font-size:24px;color:#174b80" href="EXEC: '+esc(code)+'">미발견 테스트 시작</a></p></div>';
d.lines[4]=s.enc(-1);d.lines[5]=s.enc(-1);d.lines[8]=s.enc(html);d.lines[9]='';d.lines[10]=s.enc('main_screen');d.lines[15]=s.enc(0);
const out=s.serialize(d),check=s.parse(out);assert(s.serialize(check).equals(out));for(const v of check.vars)for(const [i]of v.idx)assert(i>=0&&i<v.values.length);
assert.equal(check.lines[2],s.parse(raw).lines[2]);assert.equal(c.hash(fs.readFileSync(base)),before);
const name='JO9_MEIKI_UNDISCOVERED_TEST_20261015.sav';fs.writeFileSync(path.join(outDir,name),out);
fs.writeFileSync(path.join(outDir,'undiscovered-save-manifest.json'),JSON.stringify({base,baseHash:before,name,sha256:c.hash(out),changes,adultPresetIds:[2001,2002],initial:{virginity:0,known:0,checked:0,primary:0},probabilityPercent:5,productionProbabilityChanged:false,autostart:false,nativeVerified:false,limitations:['Initial generic adults are generated only by clicking the starter button.','This disposable copy replaces current party and room occupants and disables autosaves; base remains untouched.','No preset discovery or guaranteed 5 percent success; repeated fresh attempts may be needed.']},null,2));
console.log('Prepared '+name+'; undiscovered bootstrap verified, autosave disabled, source untouched. '+out.length+' bytes');
