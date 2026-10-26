const fs=require('node:fs'),path=require('node:path'),z=require('node:zlib'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),s=require('G:/somi/JO9sa/tools/qa/save-codec.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const root='G:/Codex/tmp/jo9-button-runtime-20261024',rec='G:/somi/JO9sa/records/restore-button-art-20261024/runtime-test',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
assert.equal(fs.realpathSync(root),'G:\\Codex\\tmp\\jo9-button-runtime-20261024');
fs.mkdirSync(rec+'/scripts',{recursive:true});
const results=[];
for(const [actor,n,callback] of [['slave','16_AUTO-SLAVE',59],['assistant','17_AUTO-ASSISTANT',45]]){
 const b=s.parse(fs.readFileSync(root+'/game/save/JO9_TEST_20261023_'+n+'.sav')),raw=fs.readFileSync(root+'/game/save/BUTTON_'+actor.toUpperCase()+'_AFTER.sav'),d=s.parse(raw),other=actor==='slave'?'assistant':'slave';
 const num=(doc,v,k)=>+s.value(doc,v,k)[0];
 assert.equal(num(d,'interaction'),callback);assert.equal(num(d,actor,'energy'),num(b,actor,'energy')-1);assert.equal(num(d,other,'energy'),num(b,other,'energy'));assert(num(d,'spawn_semen')>num(b,'spawn_semen'));
 const packed=z.gzipSync(raw,{level:9});assert(z.gunzipSync(packed).equals(raw));fs.writeFileSync(rec+'/'+actor+'-after.sav.gz',packed);
 results.push({actor,callback,display:'Gold framed tentacle artwork visually confirmed in native Qt game',screenshot:actor+'.png',actorEnergy:[num(b,actor,'energy'),num(d,actor,'energy')],otherEnergy:[num(b,other,'energy'),num(d,other,'energy')],stock:[num(b,'spawn_semen'),num(d,'spawn_semen')],saveSha256:c.hash(raw)});
 fs.copyFileSync('.button-runtime-'+actor+'.png',rec+'/'+actor+'.png');
}
for(const x of m.protected)assert.equal(c.hash(fs.readFileSync(x.path)),x.sha256,x.path);
const inspection=qa.inspectWorld(fs.readFileSync(m.source+'/game/jack.qsp'));assert.equal(inspection.sha256,m.qspSha256);
fs.copyFileSync('.button-runtime-test.cjs',rec+'/scripts/prepare.cjs');fs.copyFileSync(__filename,rec+'/scripts/verify-and-archive.cjs');fs.copyFileSync(root+'/manifest.json',rec+'/manifest.json');
const result={status:'PASS',testedAt:new Date().toISOString(),qspSha256:m.qspSha256,method:'Native Windows FastQSP Qt client; unchanged byte-identical WORK QSP, actual Game > Load of copied existing saves, real pointer clicks, native Game > Save snapshots decoded for numeric verification',testApp:root+'/game/engine/jack.exe',sourceGameProcessUntouched:true,sourceFilesPreserved:m.protected.length,productionChanges:0,results,staticInspection:inspection,notes:['Initial clone launched without a QSP argument; loaded byte-identical jack.qsp using File > Open.','First attempted save load did not leave startup page; enabled test-client Ignore version check when loading and retried through normal Game > Load successfully. Source WORK already uses ignoreCRC=true.','Saved old screen HTML is refreshed through current load hook; both copied old saves displayed dedicated art after successful load.','The earlier already-open source game showed old green art; its in-memory world was not inspected or changed.','No blanket claim about all game branches or all dynamic QSP syntax.'],committed:false,pushed:false};
fs.writeFileSync(rec+'/result.json',JSON.stringify(result,null,2));
fs.writeFileSync(rec+'/README_KO.md','# 전용 버튼 실제 실행 검증\n\nWORK와 바이트가 동일한 QSP를 격리된 FastQSP 클라이언트에서 열고 기존 16/17 세이브 복사본을 실제 Game → Load로 불러왔다. 로드 뒤 노예·조수 각각의 전용 촉수 그림을 육안 확인하고 실제 마우스로 눌렀다. Game → Save로 새 결과 파일을 저장한 뒤 콜백 59/45, 해당 인물 행동력 5→4, 미실행 인물 행동력 5 유지, 재고 증가를 검증했다.\n\nslave.png와 assistant.png는 브라우저 미리보기가 아닌 실제 Qt 게임 창 캡처다. 엔진 결과 세이브는 .sav.gz로 압축 보존했고 원본 해시를 result.json에 기록했다. 테스트 전용 클라이언트의 버전 검사 무시 설정을 사용했다. 기존 소스 게임 인스턴스에는 입력하지 않았고 원본 QSP·설정·76세이브 총79파일 해시를 대조하여 보존을 확인했다. 정적 구조·줄·주석 검사도 통과했다. 전체 게임의 모든 분기와 문법을 증명하는 검사는 아니다.\n\n게임 코드·리소스 추가 변경, 배포 폴더 반영, 커밋·푸시 없음.\n');
console.log(JSON.stringify({status:'PASS',results,protectedFiles:m.protected.length,record:rec}));
