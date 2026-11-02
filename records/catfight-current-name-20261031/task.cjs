'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict'),cp=require('child_process');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/catfight-current-name-20261031',B='G:/somi/JO9_work_backups/catfight-current-name-20261031',REC=R+'/records/catfight-current-name-20261031';
const c=require(R+'/tools/text-workshop/core.cjs'),qa=require(R+'/tools/qa/release-check.cjs'),sc=require(R+'/tools/qa/save-codec.cjs');
const q=s=>"'"+s.replaceAll("'","''")+"'",mode=process.argv[2]||'prepare';
if(mode==='prepare'){
 fs.mkdirSync(T+'/mods',{recursive:true});fs.mkdirSync(B,{recursive:true});const raw=fs.readFileSync(G+'/jack.qsp'),d=c.parse(raw),save=fs.readFileSync(G+'/save/nege.sav');a(sc.serialize(sc.parse(save)).equals(save));
 fs.writeFileSync(B+'/before.qsp',raw,{flag:'wx'});
 const loc=d.locations.find(x=>x.name==='interaction_city'),old=c.shift(d.lines[loc.body],5),staticBody=c.shift(d.lines[d.locations.find(x=>x.name==='#static_txt').body],5);
 const declaration=staticBody.split('\r\n').find(x=>x.startsWith('$catfightclub_slave_presentation[1] = '));a(declaration);const expression=declaration.slice(declaration.indexOf(' = ')+3);
 const target='\t\t$text[1] = $catfightclub_slave_presentation[1]';a.equal(old.split(target).length-1,2);
 const replacement='\t\t! JO9 MOD START CATFIGHT_CURRENT_NAME_20261031\r\n\t\t$text[1] = '+expression+'\r\n\t\t! JO9 MOD END CATFIGHT_CURRENT_NAME_20261031';
 const edit={location:'interaction_city',field:'body',old:target,new:replacement,count:2};d.lines[loc.body]=c.shift(old.split(target).join(replacement),-5);const candidate=c.serialize(d);qa.inspectWorld(candidate);a(c.serialize(c.parse(candidate)).equals(candidate));
 const patch={id:'2026-10-31_catfight_current_name',description:'Resolve Catfight introduction names at entry instead of reusing a saved pre-expanded presentation; preserve participants, combat and settlement.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits:[edit]};
 fs.writeFileSync(T+'/candidate.qsp',candidate);fs.writeFileSync(T+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2));
 fs.writeFileSync(__dirname+'/paths.json',JSON.stringify({repo:R,game:G,tmp:T,backup:B,record:REC,before:c.hash(raw),after:c.hash(candidate),save:G+'/save/nege.sav',saveHash:c.hash(save),patch:patch.id+'.json'},null,2));console.log(JSON.stringify({prepared:true,before:c.hash(raw),after:c.hash(candidate),replacements:2}));
}else if(mode==='probe'){
 const d=c.parse(fs.readFileSync(G+'/jack.qsp'));d.lines[d.locations.find(x=>x.name==='Start').body]=c.shift("msg 'JO9_QA_CATNAME_probe_COMPLETE'",-5);fs.writeFileSync(T+'/red/probe.qsp',c.serialize(d));fs.writeFileSync(T+'/red/probe-plan.json',JSON.stringify([{name:'probe',file:T+'/red/probe.qsp',marker:'JO9_QA_CATNAME_probe_COMPLETE',checkpoint:'minimal engine entry'}]));
}else if(['red','green','red-small','green-small'].includes(mode)){
 const v=JSON.parse(fs.readFileSync(__dirname+'/paths.json','utf8')),raw=fs.readFileSync(mode.startsWith('red')?B+'/before.qsp':T+'/candidate.qsp'),saved=sc.parse(fs.readFileSync(v.save)),selected=['HERO_CHOICE','SLAVE','SLAVE_RATE','SLAVE_NAME','SLAVE_TYPE','SLAVE_STATE','ASSISTANT','ASSISTANT_RATE','ASSISTANT_NAME','ASSISTANT_TYPE','ASSISTANT_STATE','MASTER_NAME','MASTER_ENERGY','SPARKS','GAME_DIFFICULTY'],prime=qa.primeState(mode.endsWith('small')?{...saved,vars:saved.vars.filter(v=>selected.includes(v.name))}:saved),dir=T+'/'+mode;
 fs.mkdirSync(dir,{recursive:true});fs.cpSync(G+'/json',dir+'/json',{recursive:true});fs.copyFileSync(G+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const cases=[['slave',13,sc.value(saved,'assistant_name')[1],sc.value(saved,'slave_name')[1]],['legacy',100,sc.value(saved,'assistant_name')[1],sc.value(saved,'slave_name')[1]],['again',13,'검사이름',sc.value(saved,'slave_name')[1]]],plan=[];
 for(const [name,hero,current,stale]of cases){const d=c.parse(raw),marker='JO9_QA_CATNAME_'+name+'_COMPLETE';
  const assign=(n,b)=>{const l=d.locations.find(x=>x.name===n);a(l,n);d.lines[l.body]=c.shift(b,-5);};
  const cached=saved.vars.find(v=>v.name==='CATFIGHTCLUB_SLAVE_PRESENTATION').values[1][1];a(cached.includes(stale));
  assign('Start',['killall',prime.code,"$counter=''","$ongload=''","$onnewloc=''",'settimer 0','autosave=0','decadesave=0','snk_room_target=0',"gs 'refresh_database'","$onnewloc=''",'hero_choice='+hero,'$slave_name='+q(current),'$master_name='+q('현재주인'),'$catfightclub_slave_presentation[1]='+q(cached),"$place='catfightclub'",'interaction_city=103001','qa_fail=0',"gt 'interaction_city'"].join('\r\n'));
  assign('interaction_result_city',[
   'if instr($text[1],'+q(current)+')=0: qa_fail+=1',
   'if instr($text[1],'+q(stale)+')>0: qa_fail+=1',
   "if instr($text[1],'현재주인')=0: qa_fail+=1",
   'if $slave_name!'+q(current)+': qa_fail+=1',
   "if $return_lock! '$catfight_fight_start': qa_fail+=1",
   'if количество_врагов!1: qa_fail+=1',
   "if $враг[1]!$ge: qa_fail+=1",
   'savegame '+q(name+'.sav'),
   'if qa_fail>0: msg '+q('CATNAME_FAILURE_'+name)+' & exit',
   'msg '+q(marker),'exit'].join('\r\n'));
  const fixture=c.serialize(d);qa.inspectWorld(fixture);fs.writeFileSync(dir+'/'+name+'.qsp',fixture);plan.push({name,file:dir+'/'+name+'.qsp',marker,checkpoint:'nege saved presentation, current slave name and actual interaction_city=103001, diagnostic result endpoint'});
 }
 fs.writeFileSync(dir+'/plan.json',JSON.stringify(plan,null,2));console.log(dir+'/plan.json');
}else if(mode==='install'){
 const v=JSON.parse(fs.readFileSync(__dirname+'/paths.json','utf8')),results=JSON.parse(fs.readFileSync(T+'/green-small/client-results.json','utf8').replace(/^\uFEFF/,''));a(results.length===3&&results.every(x=>x.pass));
 const red=JSON.parse(fs.readFileSync(T+'/red-small/client-results.json','utf8').replace(/^\uFEFF/,''));a(red.length===3&&red.every(x=>!x.pass));for(const r of red){const s=sc.parse(fs.readFileSync(T+'/red-small/'+r.name+'.sav'));a.equal(Number(sc.value(s,'qa_fail')[0]),3);a(fs.readFileSync(T+'/red-small/'+r.name+'-stderr.log','utf8').includes('CATNAME_FAILURE_'+r.name));}
 const releaseRoot='G:/Codex/tmp/catfight-current-name-release-20261031';const releases=fs.readdirSync(releaseRoot).filter(x=>x.startsWith('run-')).map(n=>({dir:releaseRoot+'/'+n,report:JSON.parse(fs.readFileSync(releaseRoot+'/'+n+'/report.json','utf8'))}));const pass=releases.find(x=>x.report.verdict==='PASS');a(pass,'release PASS required');
 a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),v.before);a.equal(c.hash(fs.readFileSync(v.save)),v.saveHash);
 cp.execFileSync('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',R+'/tools/apply_mods.ps1','-Qsp',G+'/jack.qsp','-ModsDir',T+'/mods'],{stdio:'inherit'});
 a.equal(c.hash(fs.readFileSync(G+'/jack.qsp')),v.after);a.equal(c.hash(fs.readFileSync(v.save)),v.saveHash);fs.mkdirSync(REC,{recursive:true});fs.copyFileSync(T+'/mods/'+v.patch,R+'/mods/'+v.patch);
 const planFile=R+'/records/full-client-preparation-20261029/full-client-input-plan.json';const bytes=fs.readFileSync(planFile),plan=JSON.parse(bytes);a.equal(plan.qspSha256,v.before);fs.writeFileSync(B+'/full-client-input-plan.json.gz',require('zlib').gzipSync(bytes),{flag:'wx'});plan.qspSha256=v.after;const row=plan.files.find(x=>x.path==='game/jack.qsp');a.equal(row.sha256,v.before);row.sha256=v.after;row.bytes=fs.statSync(G+'/jack.qsp').size;plan.summary.includedBytes=plan.files.reduce((n,x)=>n+x.bytes,0);fs.writeFileSync(planFile,JSON.stringify(plan,null,2)+'\n');
 for(const f of ['task.cjs','paths.json'])fs.copyFileSync(__dirname+'/'+f,REC+'/'+f);for(const f of ['report.json','report.md'])fs.copyFileSync(pass.dir+'/'+f,REC+'/release-'+f);
 const evidence=results.map(r=>{const s=sc.parse(fs.readFileSync(T+'/green-small/'+r.name+'.sav'));return{name:r.name,pass:r.pass,fail:Number(sc.value(s,'qa_fail')[0]),currentName:sc.value(s,'slave_name')[1],presentation:s.vars.find(v=>v.name==='TEXT').values[1][1],cachedPresentation:s.vars.find(v=>v.name==='CATFIGHTCLUB_SLAVE_PRESENTATION').values[1][1]};});a(evidence.every(x=>x.fail===0));
 fs.writeFileSync(REC+'/verification.json',JSON.stringify({...v,red,green:evidence,assertions:21,release:'PASS',saveUnchanged:true,guiSaveLoadTested:false},null,2));
 fs.writeFileSync(REC+'/MANUAL_KO.md',`# 캣파이트 소개 이름 갱신\n\ninteraction_city=103001의 현행/옛 주인공 분기 두 곳에서, 저장된 소개문을 복사하던 부분을 진입 당시 $slave_name과 $master_name으로 만드는 직접 문자열 대입으로 바꿨다. CATFIGHT_CURRENT_NAME_20261031, 두 지점. 원문 문구는 유지했다. 입력은 현재 이름 두 값, 출력은 기존 $text[1]이다. 새 로케이션·변수·이관·캐시 초기화는 없다. 기존 #static_txt 선언과 옛 세이브의 저장 문자열은 남지만 해당 두 경로에서 소비하지 않는다. 참가자 선택·전투·보상·처분은 수정하지 않았다.\n\n제공된 nege.sav에 저장된 소개는 유로라이고 조수 이름은 이사벨라다. 이 원본 세이브를 읽기만 하고 대표 상태를 격리 진단 QSP에 구성했다. 실제 interaction_city 코드를 실행하여 이전 소개를 남겨 둔 상태에서 이사벨라/다른 이름, 현행/옛 주인공 분기 3표본의 이름 갱신·주인 이름·현재 이름 불변·전투 복귀 경로·적 선택 21조건을 확인했다. 수정 전 3표본 모두 실패, 수정 후 모두 통과. 원본 SAV GUI 불러오기와 마우스로 동면/교체하는 전체 플레이는 미검사다.\n\n공식 출고 PASS: QSP 구조·줄 경계·주석 경계·정확한 패치 재생·재적용, JSON 등록, 실제 엔진 9경로. WORK/입력 SAV 해시를 다시 확인했다. 배포 폴더·이미지·세이브·ZIP·커밋·푸시는 변경하지 않았다. 빌드 입력 계획의 QSP 해시만 갱신했다. 이 부분을 제거하면 오래된 소개 이름 문제가 돌아온다. 기존 상호작용 출력과 QSP 문자열 보간에 의존하며 별도 helper는 없다.\n\n백업: ${B}/before.qsp\nWORK SHA256: ${v.after}\n`);
 console.log(JSON.stringify({installed:true,sha256:v.after,nativeCases:3,assertions:21,release:'PASS',saveUnchanged:true}));
}else throw Error('Unknown mode');
