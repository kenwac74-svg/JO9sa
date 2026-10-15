const fs=require('fs'),assert=require('assert'),path=require('path');
const s=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const base=process.argv[2]||'G:/somi/Jack O Nine Tails v2.4_work/game/save/hbe.sav';
const outDir=process.argv[3]||path.join(require('os').tmpdir(),'JO9-meiki-state-test-20261015');fs.mkdirSync(outDir,{recursive:true});
const raw=fs.readFileSync(base),d=s.parse(raw),before=c.hash(raw);assert(s.serialize(d).equals(raw));
const changes=[];
function str(name,value){const v=d.vars.find(v=>v.name===name);if(!v)return;assert(v.values.length);changes.push({name,before:v.values[0][1],after:value});v.values[0][1]=value;}
for(const name of ['ONGLOAD','ONNEWLOC','ONACTSEL','ONOBJSEL','COUNTER'])str(name,'');
assert.equal(+s.value(d,'CONST_INT','milf_age')[0],2);
const report="msg '상태: <<slave[\u0027virginity\u0027]>>; 발견: <<slave[\u0027jo9_meiki_known\u0027]>>; 판정완료: <<slave[\u0027jo9_meiki_checked\u0027]>>'";
const reset="killvar 'slave' & slave['age'] = 2 & slave['virginity'] = 0 & gs 'jo9_meiki_state', 'slave', 0";
const buttons=[
 ['1. 진단 데이터 초기화 — 성인 상태 0',reset+' & '+report],
 ['2. 최초 전환 — 5% 판정',"slave['virginity'] = 2 & gs 'jo9_meiki_state', 'slave', 1 & "+report],
 ['3. 발견된 상태 4 준비 — 테스트 전용',"slave['virginity'] = 4 & gs 'jo9_meiki_state', 'slave', 0 & "+report],
 ['4. 복원상태 1',"slave['virginity'] = 1 & gs 'jo9_meiki_state', 'slave', 0 & "+report],
 ['5. 복원 해제 — 발견 이력이 있으면 4',"slave['virginity'] = 2 & gs 'jo9_meiki_state', 'slave', 1 & "+report],
 ['6. 상태 3 덮어쓰기 방지',"slave['virginity'] = 3 & gs 'jo9_meiki_state', 'slave', 0 & "+report],
 ['7. 조수 배열로 복사 — 이력 유지',"copyarr 'assistant', 'slave' & gs 'jo9_meiki_state', 'assistant', 0 & msg '조수 상태: <<assistant[\u0027virginity\u0027]>>; 발견: <<assistant[\u0027jo9_meiki_known\u0027]>>'"],
 ['현재 값 확인',report]
];
const esc=x=>x.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const html='<div style="position:absolute;left:20px;top:20px;width:700px;padding:18px;background:#eee4cd;color:#222;font-size:18px"><h2>상태 전환 진단</h2><p>일반 플레이용이 아닌 독립 진단 복사본입니다. 원래 hbe 세이브는 수정하지 않습니다.<br>먼저 1번을 누르세요. 1→2는 확률 판정, 1→3→4→5는 영구 이력 검사입니다.<br>1→4→5에서는 발견이 없어야 합니다. 3→6, 3→7에서는 상태 4를 유지해야 합니다.<br>반복 클릭으로 5%를 검증하지 말고 경계값 자동검사 결과를 참고하세요.<br>닫고 다른 세이브를 불러오면 진단을 종료합니다.</p>'+buttons.map(([label,code])=>'<p><a style="color:#174b80" href="EXEC: '+esc('SETTIMER 0 & '+code)+'">'+label+'</a></p>').join('')+'</div>';
d.lines[4]=s.enc(-1);d.lines[5]=s.enc(-1);d.lines[8]=s.enc(html);d.lines[9]='';d.lines[10]=s.enc('main_screen');d.lines[15]=s.enc(0);
const out=s.serialize(d),check=s.parse(out);assert(s.serialize(check).equals(out));assert.equal(check.lines[2],s.parse(raw).lines[2]);
for(const v of check.vars)for(const [index]of v.idx)assert(index>=0&&index<v.values.length);
fs.writeFileSync(path.join(outDir,'JO9_MEIKI_STATE_TEST_20261015.sav'),out);
assert.equal(c.hash(fs.readFileSync(base)),before);
fs.writeFileSync(path.join(outDir,'save-manifest.json'),JSON.stringify({base,baseHash:before,sha256:c.hash(out),changes,limitations:['Diagnostic state transitions only; no native gameplay verified.','No skill bonus test or scripted encounter.','Existing save game-data arrays remain unchanged until diagnostic button clicks.']},null,2));
console.log('Prepared diagnostic save; base unchanged, roundtrip and index bounds pass. '+out.length+' bytes');
