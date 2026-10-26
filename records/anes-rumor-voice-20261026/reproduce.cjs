'use strict';
const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const c=require(repo+'/tools/text-workshop/core.cjs'),qa=require(repo+'/tools/qa/release-check.cjs'),sc=require(repo+'/tools/qa/save-codec.cjs');
const tmp='G:/Codex/tmp/anes-rumor-20261026',rec=repo+'/records/anes-rumor-voice-20261026',id='2026-10-26_anes_rumor_voice';
const expected='79f17f61720224779583bdbb6d974ec432f2da7423fdd4d89b38b0cd3c387b21';
const q=s=>"'"+s.replaceAll("'","''")+"'",write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function get(d,n){return c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);}
function set(d,n,s){d.lines[d.locations.find(l=>l.name===n).body]=c.shift(s.replace(/\r?\n/g,'\r\n'),-5);}
function protectedFiles(){const out=[];function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isSymbolicLink())continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.sav$/i.test(e.name))out.push(p);}}walk(game+'/save');out.push(game+'/css/base.css',game+'/json/menu_icon.json',game+'/content/js/jo9_word_wrap.js','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp','G:/somi/JO9O/game/jack.qsp');return out.filter(p=>fs.existsSync(p)).map(p=>({path:p,sha256:c.hash(fs.readFileSync(p))}));}
if(process.argv[2]==='prepare'){
 assert(!fs.existsSync(tmp)&&!fs.existsSync(rec),'Fresh task directories required');
 const before=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(before),expected);qa.inspectWorld(before);
 const baselineDoc=c.parse(before),d=c.parse(before),old='*p \'<div id="text" style="color:#20160e;overflow:auto;">[<<$npc_name[$jo9_rm_npc]>>]<br><<$jo9_rumor_pages[jo9_rumor_page]>></div>\'';
 const replacement=[
  '! JO9 MOD START ANES_RUMOR_VOICE_20261026 | '+id,
  '! Render Anes in her established polite voice, including pages restored from an earlier save.',
  "local $jo9_rm_page_text = $jo9_rumor_pages[jo9_rumor_page]",
  "if $jo9_rm_provider = 'anes':",
  " $jo9_rm_page_text = replace($jo9_rm_page_text, '내가 듣기로는 ', '제가 듣기로는 ')",
  " $jo9_rm_page_text = replace($jo9_rm_page_text, '의 상태가 잘 맞는군. 이 근방에서도 눈여겨볼 만한 상대들이지. 직접 찾아가 이야기를 들어 보게.', '의 상태가 잘 맞아요. 이 근방에서도 눈여겨볼 만한 분들이에요. 직접 찾아가 이야기를 들어 보세요.')",
  " $jo9_rm_page_text = replace($jo9_rm_page_text, '에게는 지금 이 지역에서 권할 만한 고정 구매처가 떠오르지 않는군. 몸 상태나 낙인, 교육 정도를 다시 살펴보게.', '에게는 지금 이 지역에서 권할 만한 고정 구매처가 떠오르지 않네요. 몸 상태나 낙인, 교육 정도를 다시 살펴보세요.')",
  'end',
  '*p \'<div id="text" style="color:#20160e;overflow:auto;">[<<$npc_name[$jo9_rm_npc]>>]<br><<$jo9_rm_page_text>></div>\'',
  '! JO9 MOD END ANES_RUMOR_VOICE_20261026'
 ].join('\r\n');
 const body=get(d,'jo9_buyer_rumors');assert.equal(body.split(old).length-1,1);set(d,'jo9_buyer_rumors',body.replace(old,()=>replacement));
 const after=c.serialize(d);qa.inspectWorld(after);assert(c.serialize(c.parse(after)).equals(after));
 for(const loc of d.locations)if(loc.name!=='jo9_buyer_rumors')assert.equal(get(d,loc.name),get(baselineDoc,loc.name));
 fs.mkdirSync(tmp+'/patches',{recursive:true});fs.mkdirSync(rec,{recursive:true});fs.writeFileSync(tmp+'/before.qsp',before);fs.writeFileSync(tmp+'/candidate.qsp',after);fs.writeFileSync(rec+'/before.qsp.gz',z.gzipSync(before,{level:9}));
 const patch={id,before_sha256:expected,after_sha256:c.hash(after),edits:[{location:'jo9_buyer_rumors',field:'body',old,new:replacement,count:1}]};
 write(tmp+'/patches/'+id+'.json',patch);write(rec+'/patch.json',patch);write(repo+'/mods/'+id+'.json',patch);write(rec+'/protected.json',protectedFiles());
 fs.copyFileSync(__filename,rec+'/reproduce.cjs');
 const fixture=game+'/save/JO9_TEST_BANKRUPTCY_UI_20261025_R2/07_slave-trait-ui.sav',prime=qa.primeState(sc.parse(fs.readFileSync(fixture)));
 const positive='내가 듣기로는 라니스타 그레타 쪽에서 찾는 조건과 이사벨라의 상태가 잘 맞는군. 이 근방에서도 눈여겨볼 만한 상대들이지. 직접 찾아가 이야기를 들어 보게.';
 const negative='이사벨라에게는 지금 이 지역에서 권할 만한 고정 구매처가 떠오르지 않는군. 몸 상태나 낙인, 교육 정도를 다시 살펴보게.';
 const cases=[['anes-match','anes',positive,'제가 듣기로는 라니스타 그레타 쪽에서 찾는 조건과 이사벨라의 상태가 잘 맞아요. 이 근방에서도 눈여겨볼 만한 분들이에요. 직접 찾아가 이야기를 들어 보세요.'],['anes-none','anes',negative,'이사벨라에게는 지금 이 지역에서 권할 만한 고정 구매처가 떠오르지 않네요. 몸 상태나 낙인, 교육 정도를 다시 살펴보세요.'],['skups-match','skups',positive,positive],['barman-match','barman',positive,positive]];
 const dir=tmp+'/voice';fs.mkdirSync(dir);for(const n of ['css','content','fonts'])fs.symlinkSync(game+'/'+n,dir+'/'+n,'junction');fs.cpSync(game+'/json',dir+'/json',{recursive:true});fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const plan=[];
 for(const [name,provider,page,wanted] of cases){
  const doc=c.parse(after),marker='JO9_QA_ANES_'+name.replaceAll('-','_')+'_COMPLETE';
  const command="msg $iif(sparks = 99 and $jo9_rumor_pages[0] = $qa_original_page, '"+marker+"', 'FAIL_ANES_STATE_CHANGED')";
  const js='setTimeout(function(){var e=document.getElementById("text");var ok=e&&e.textContent.indexOf('+JSON.stringify(wanted)+')>=0;var a=document.createElement("a");a.href="EXEC:"+(ok?'+JSON.stringify(command)+':"msg \'FAIL_ANES_RENDER\'");document.body.appendChild(a);var ev=document.createEvent("MouseEvents");ev.initMouseEvent("click",true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(ev);},300);';
  set(doc,'jo9_buyer_rumors',get(doc,'jo9_buyer_rumors')+'\r\n*p '+q('<script type="text/javascript">'+js+'</script>'));
  set(doc,'Start',['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''","gs 'refresh_database'","$counter=''","$ongload=''","$onnewloc=''",'settimer 0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','nsfw=1','usehtml=1','sound_on=0','snk_room_target=0','sparks=99',"$place='kafe'","$jo9_rumor_provider="+q(provider),'jo9_rumor_page=0',"killvar '$jo9_rumor_pages'",'$jo9_rumor_pages[0]='+q(page),'$qa_original_page='+q(page),"gt 'jo9_buyer_rumors','view',"+q(provider)].join('\r\n'));
  const bytes=c.serialize(doc);qa.inspectWorld(bytes);const file=dir+'/'+name+'.qsp';fs.writeFileSync(file,bytes);plan.push({name,file,marker,checkpoint:'Actual displayed rumor text; Anes match/no-match polite voice; other two speakers unchanged; saved page and money unchanged.'});
 }
 write(dir+'/plan.json',plan);write(rec+'/prepared.json',{before:expected,after:c.hash(after),fixture,fixtureHash:c.hash(fs.readFileSync(fixture)),cases:cases.map(([name,provider,page,wanted])=>({name,provider,page,wanted})),newLocations:0,newPersistentKeys:0,scope:'Only displayed Anes rumor text; existing saved pages rendered without rewriting them.'});
 console.log(JSON.stringify({candidate:tmp+'/candidate.qsp',patch:tmp+'/patches/'+id+'.json',before:expected,after:c.hash(after),nativeCases:plan.length}));
}else if(process.argv[2]==='install'){
 const report=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));assert.equal(report.verdict,'PASS');
 const native=JSON.parse(fs.readFileSync(tmp+'/voice/client-results.json','utf8').replace(/^\uFEFF/,''));assert.equal(native.length,4);assert(native.every(x=>x.pass));
 const current=fs.readFileSync(game+'/jack.qsp');assert.equal(c.hash(current),expected,'WORK changed while checking; do not overwrite');
 const candidate=fs.readFileSync(tmp+'/candidate.qsp'),patch=JSON.parse(fs.readFileSync(rec+'/patch.json','utf8'));assert.equal(c.hash(candidate),patch.after_sha256);
 const protectedBefore=JSON.parse(fs.readFileSync(rec+'/protected.json','utf8'));for(const f of protectedBefore)assert.equal(c.hash(fs.readFileSync(f.path)),f.sha256,f.path);
 fs.copyFileSync(process.argv[3],rec+'/release-report.json');fs.copyFileSync(tmp+'/voice/client-results.json',rec+'/voice-results.json');for(const n of native.map(x=>x.name))fs.copyFileSync(tmp+'/voice/'+n+'-stderr.log',rec+'/'+n+'-stderr.log');
 fs.writeFileSync(game+'/jack.qsp',candidate);assert.equal(c.hash(fs.readFileSync(game+'/jack.qsp')),patch.after_sha256);
 write(rec+'/FINAL_RESULT.json',{status:'APPLIED_AND_VERIFIED',before:expected,after:patch.after_sha256,changedRuntimeFiles:[game+'/jack.qsp'],nativeVoiceCases:4,releaseVerdict:report.verdict,protectedFiles:protectedBefore.length,savesPreserved:protectedBefore.filter(x=>/\.sav$/i.test(x.path)).length,newLocations:0,newPersistentKeys:0,fullSynced:false,committed:false,pushed:false,limits:['Native DOM text and saved-state priming; no claim of physical mouse or reporter-save GUI Load/CRC testing.']});
 fs.writeFileSync(rec+'/MANUAL_KO.md','# 아네스 구매자 소문 말투\n\n아네스의 기존 기본 대화에 맞춰 소문을 해요체로 표시한다. 추천 결과는 “제가 듣기로는 … 상태가 잘 맞아요. … 직접 찾아가 이야기를 들어 보세요.”, 미발견 결과는 “떠오르지 않네요. … 다시 살펴보세요.”로 바꿨다.\n\n호출: jo9_buyer_rumors view 출력 직전, ANES_RUMOR_VOICE_20261026 표식. 기존 페이지를 LOCAL 문자열로 복사하고 아네스일 때 세 문구만 바꿔 하단 대사에 출력한다. 기존 저장 페이지는 쓰지 않아 이전 소문도 추가 결제 없이 이 말투로 표시된다. 스컵스·작크 문구, 추천 판정·대상·가격·할인·이동·인물 정보에는 변경이 없다. 새 로케이션·영구 저장 키는 없다. 이 블록을 제거하면 출력 변수도 기존 페이지 배열로 되돌려야 한다.\n\n실제 설치 엔진에서 아네스 추천/미발견 및 다른 두 안내자 유지, 소문 페이지 원본·보유금 불변을 검사했다. 공식 출고 검사 PASS. 기존 세이브와 Full은 해시로 보존을 확인했다. 실제 신고 세이브 GUI Load/CRC·물리 마우스 검사는 별도다.\n\n패치는 patch.json 및 mods/2026-10-26_anes_rumor_voice.json, 직전 QSP는 before.qsp.gz로 복구 가능하다. WORK만 반영했으며 배포·커밋·푸시는 하지 않았다.\n');
 console.log(JSON.stringify({installed:true,hash:patch.after_sha256,savesPreserved:protectedBefore.filter(x=>/\.sav$/i.test(x.path)).length}));
}else throw Error('Use prepare or install <release report path>');
