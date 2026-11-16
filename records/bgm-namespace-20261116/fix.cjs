'use strict';
const fs=require('fs'),a=require('assert/strict'),z=require('zlib');
const R='G:/somi/JO9sa',G='G:/somi/Jack O Nine Tails v2.4_work/game',T='G:/Codex/tmp/bgm-namespace-20261116',D=R+'/records/bgm-namespace-20261116',c=require(R+'/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(G+'/jack.qsp'),doc=c.parse(raw),loc=n=>doc.locations.find(x=>x.name===n),body=n=>c.shift(doc.lines[loc(n).body],5),edits=[];
const definitions=body('#static_base').match(/\$music\['ride'\][\s\S]*?\$music\['tower'\][^\r\n]*/)[0];
const tracks=definitions.replaceAll('$music[','$jo9_bgm_track[');
function edit(n,next){const old=body(n);a.notEqual(old,next);edits.push({location:n,field:'body',old,new:next,count:1});doc.lines[loc(n).body]=c.shift(next,-5);}
edit('#static_base',body('#static_base').replace(definitions,"! JO9 MOD START BGM_NAMESPACE_20261116\r\ngs 'jo9_audio_formats','tracks'\r\n! JO9 MOD END BGM_NAMESPACE_20261116"));
edit('#dynamic',body('#dynamic').replaceAll('$music[','$jo9_bgm_track['));
edit('jo9_residence_bgm',body('jo9_residence_bgm').replaceAll('$music[','$jo9_bgm_track['));
const load="! JO9 MOD START BGM_NAMESPACE_20261116\r\nif $args[0]='tracks':\r\n"+tracks.split('\r\n').map(x=>' '+x).join('\r\n')+"\r\n $play_music=replace($play_music,'$music[','$jo9_bgm_track[')\r\n if $toplay='jo9_direct_event' and $jo9_bgm_track['jo9_direct_event']='': $jo9_bgm_track['jo9_direct_event']=$music_now\r\n exit\r\nend\r\n! JO9 MOD END BGM_NAMESPACE_20261116\r\n";
edit('jo9_audio_formats',load+body('jo9_audio_formats').replaceAll("arrsize('$music')","arrsize('$jo9_bgm_track')").replaceAll('$music[','$jo9_bgm_track['));
edit('$ongload',"! JO9 MOD START BGM_NAMESPACE_LOAD_20261116\r\ngs 'jo9_audio_formats','tracks'\r\n! JO9 MOD END BGM_NAMESPACE_LOAD_20261116\r\n"+body('$ongload'));
const candidate=c.serialize(doc);a(c.serialize(c.parse(candidate)).equals(candidate));
for(const file of ['race_master.mp3','fight_arena.mp3','fight_girl.mp3','fight_master.mp3'])a(fs.existsSync(G+'/content/snd/'+file),file);
const examples=['3021_Diana.json','3022_Hilda.json','3023_Iris.json','3024_Alexia.json'].map((f,i)=>({id:3021+i,value:JSON.parse(fs.readFileSync(G+'/json/slaves/'+f)).music}));
const quote=t=>"'"+t.replaceAll("'","''")+"'";
if(process.argv.includes('--apply')){
 const proof=JSON.parse(fs.readFileSync(T+'/client-results.json','utf8').replace(/^\uFEFF/,''));a.equal(proof.find(x=>x.name==='green').pass,true);a.equal(proof.find(x=>x.name==='red').pass,false);
 const mp=R+'/assets/runtime-source-2.4.1.json',manifestRaw=fs.readFileSync(mp),m=JSON.parse(manifestRaw);a(fs.readFileSync(R+'/assets/runtime/2.4.1/jack.qsp').equals(raw));a.equal(m.sourceQspSha256.toLowerCase(),c.hash(raw));a(!fs.existsSync(D+'/before.qsp.gz'));fs.mkdirSync(D,{recursive:true});
 fs.writeFileSync(D+'/before.qsp.gz',z.gzipSync(raw));fs.writeFileSync(D+'/manifest.before.json',manifestRaw);
 const patch={id:'2026-11-16_bgm_namespace',description:'Separate BGM keys from character music image JSON indexes; repair legacy playback cache on load.',before_sha256:c.hash(raw),after_sha256:c.hash(candidate),edits};
 fs.writeFileSync(G+'/jack.qsp',candidate);fs.writeFileSync(R+'/assets/runtime/2.4.1/jack.qsp',candidate);fs.writeFileSync(R+'/mods/'+patch.id+'.json',JSON.stringify(patch,null,2)+'\n');
 m.sourceQspSha256=patch.after_sha256;m.snapshotDate='2026-11-16';const row=m.files.find(x=>x.runtimePath==='jack.qsp');row.sha256=patch.after_sha256;row.bytes=candidate.length;m.latestBgmNamespace={mod:patch.id,report:'records/bgm-namespace-20261116/REPORT_KO.md'};fs.writeFileSync(mp,JSON.stringify(m,null,2)+'\n');
 fs.copyFileSync(T+'/client-results.json',D+'/native-results.json');for(const n of ['red','green'])fs.copyFileSync(T+'/'+n+'-stderr.log',D+'/'+n+'-stderr.log');
 fs.copyFileSync(__filename,D+'/fix.cjs');fs.writeFileSync(D+'/REPORT_KO.md',`# 전투·경주 BGM 배열 충돌 수정\n\n기존 music 이름 인덱스3021~3024가 Diana/Hilda/Iris/Alexia JSON music 이미지 값에 덮여 경주·투기장·여성전투는 빈 값, 주인공전투는 이미지 경로가 됐다.\n\nBGM22개를 전용 jo9_bgm_track 정적 목록으로 분리하고 #dynamic 재생·직접 이벤트·오디오형식 변환도 같은 목록을 사용한다. 기존 music 숫자형 이미지 데이터는 수정하지 않는다. 기존 jo9_audio_formats 위치에 tracks 분기를 추가해 새 위치는 만들지 않았으며, 소규모 정적 배열1개가 생긴다. ongload가 목록과 저장된 play_music 코드 참조를 즉시 갱신한다. 신규 초기화는 static_base에서 같은 분기를 사용한다.\n\n네이티브 검사: 같은 내부3021~3024 충돌을 만든 기존코드는4개 BGM 값 실패, 수정코드는 신규정의·기존캐시로드·4개 BGM복구·캐릭터 이미지보존 검사 통과. 전투·경주 4개 음원파일 존재와 QSP 바이트왕복 확인. 실제 소리 청음은 사용자 확인이 필요하다. 앞선 중복 CLOSE 크래시 수정은 유지한다.\n\n입력은 음악유형 topLay, 출력은 기존 music_now와 PLAY. 볼륨·재생플래그·보상은 그대로. 제거시 static_base/dynamic/audio_formats/ongload/직접이벤트 참조를 함께 되돌려야 한다. 원본세이브·음원·JSON·배포·커밋푸시 변경없음.\n\n${patch.before_sha256} → ${patch.after_sha256}\n`);console.log(JSON.stringify({after:patch.after_sha256,locations:edits.map(e=>e.location)}));
}else{
 fs.mkdirSync(T,{recursive:true});fs.writeFileSync(T+'/config.xml','<game width="400" height="150" title="JO9 BGM map QA"/>');fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const checks="if $jo9_bgm_track['ride']!'content/snd/race_master.mp3': qa_failed+=1\r\nif $jo9_bgm_track['arena']!'content/snd/fight_arena.mp3': qa_failed+=1\r\nif $jo9_bgm_track['girl']!'content/snd/fight_girl.mp3': qa_failed+=1\r\nif $jo9_bgm_track['fight']!'content/snd/fight_master.mp3': qa_failed+=1\r\n";
 const plan=[];
 for(const mode of ['red','green']){
  let start="$music[3020]='image-preserved'\r\n"+(mode==='red'?definitions:tracks)+"\r\n"+examples.map(x=>`$music[${x.id}]=${quote(x.value)}`).join('\r\n')+"\r\nqa_failed=0\r\n";
  start+=mode==='red'?checks.replaceAll('$jo9_bgm_track[','$music['):checks;
  if(mode==='green'){start+="$play_music='$music_now=$music[$toplay]'\r\ngs 'jo9_audio_formats','tracks'\r\n$toplay='fight'\r\ndynamic $play_music\r\nif $music_now!'content/snd/fight_master.mp3': qa_failed+=1\r\n";for(const x of examples)start+=`if $music[${x.id}]!${quote(x.value)}: qa_failed+=1\r\n`;}
  start+=`if qa_failed=0:\r\n msg 'JO9_QA_BGMMAP_${mode}_COMPLETE'\r\nelse\r\n msg 'JO9_QA_BGMMAP_FAIL failed='+str(qa_failed)\r\nend`;
  const fields=['QSPGAME','bgm qa','',c.shift('2',-5),c.shift('Start',-5),'',c.shift(start,-5),c.shift('0',-5),c.shift('jo9_audio_formats',-5),'',c.shift(body('jo9_audio_formats'),-5),c.shift('0',-5),''];
  const test=Buffer.from(fields.join('\r\n'),'utf16le');c.parse(test);fs.writeFileSync(T+'/'+mode+'.qsp',test);plan.push({name:mode,file:T+'/'+mode+'.qsp',marker:'JO9_QA_BGMMAP_'+mode+'_COMPLETE',checkpoint:'BGM-index collision and legacy cache recovery'});
 }fs.writeFileSync(T+'/plan.json',JSON.stringify(plan,null,2));console.log('Prepared collision regression and legacy-load tests.');
}
