'use strict';
const fs=require('fs'),a=require('assert/strict'),path=require('path'),crypto=require('crypto');
const F='G:/somi/Jack O Nine Tails v2.4 Kor_Full',R='G:/somi/JO9sa',REC=R+'/records/full-client-build-20261031',hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const aliases=[
 ['scene/pope.png','characters/pope.png','same-character-path-compatibility'],
 ['scene/portal.png','bg/fogs_portal.png','same-location-path-compatibility'],
 ['scene/vatican_paladin.png','bg/vatican_paladin.png','same-event-path-compatibility'],
 ['scene/strazhnik.png','bg/strazhnik.png','same-event-path-compatibility'],
 ['scene/slaughter_work2.png','scene/slaughter_work_start.png','temporary-existing-scene-fallback'],
 ...[5,6,7,8].map(n=>['scene/blindfold_'+n+'.png',n===5?'scene/blindfold.png':'scene/blindfold_'+(n-4)+'.png','temporary-existing-scene-fallback'])
];
const rows=[];for(const [to,from,kind]of aliases){const dest=F+'/game/content/pic/'+to,source=F+'/game/content/pic/'+from;a(fs.existsSync(source),source);fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.copyFileSync(source,dest,fs.constants.COPYFILE_EXCL);a.equal(hash(dest),hash(source));rows.push({path:'game/content/pic/'+to,source:'game/content/pic/'+from,bytes:fs.statSync(dest).size,sha256:hash(dest),origin:kind});}
const mf=JSON.parse(fs.readFileSync(F+'/BUILD_MANIFEST.json','utf8'));mf.files.push(...rows.map(({source,...x})=>x));mf.summary.runtimeFiles=mf.files.length;mf.summary.runtimeBytes=mf.files.reduce((n,x)=>n+x.bytes,0);fs.writeFileSync(F+'/BUILD_MANIFEST.json',JSON.stringify(mf,null,2)+'\n');
fs.writeFileSync(REC+'/resource-compatibility-additions.json',JSON.stringify(rows,null,2));fs.copyFileSync(__filename,REC+'/complete-assets.cjs');
fs.appendFileSync(F+'/ARTWORK_PENDING_KO.md','\n## 기존 경로 누락의 호환 사본\n\n기존 코드가 찾는 폴더와 그림이 있던 폴더가 다른 교황·포털·성기사·포털 가디언은 같은 인물/이벤트 그림의 사본을 추가했습니다. slaughter_work2는 기존 작업 시작 컷, blindfold_5~8은 기존 1~4 컷 반복으로 임시 호환했습니다. 새 그림을 만든 것은 아니며 WORK QSP와 원본을 바꾸지 않았습니다.\n');
fs.writeFileSync(F+'/FOLLOW_UP_KO.md','# 돌아온 뒤 확인할 사항\n\n- ARTWORK_PENDING_KO.md의 사용자 공급 예정 결과 컷 5개를 전용 그림으로 교체해 주세요. 현재는 이전 공통 결과 컷 사본입니다.\n- 삭제 예정 표시 중 3개 서비스 원본은 실행 참조가 남아 필수 예외로 포함했습니다. 실제 제거하려면 이후 대체 그림/호출 처리 결정을 해야 합니다.\n- 오래된 아그라바 이야기 interaction_city=30117의 일부 페이지에는 Jasmine23.png.·Raja1.png.처럼 파일명 뒤 점이 붙은 참조 3곳이 남아 있습니다. 정상 이름의 그림은 포함돼 있지만 이 경로가 엔진에서 표시되는지는 수동 재현 후 수정 대상으로 보류했습니다. 이를 고쳤다고 보고하지 않습니다.\n- 전체 캠페인·모든 기존 사용자 세이브의 UI 불러오기와 최종 이미지 품질은 자동 검사 대상이 아닙니다. PLAYTEST_KO.md를 확인해 주세요.\n');
console.log(JSON.stringify({added:rows.length,bytes:rows.reduce((n,x)=>n+x.bytes,0),qspChanged:false}));
