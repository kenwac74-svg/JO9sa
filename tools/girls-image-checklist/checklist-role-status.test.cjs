'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root=process.env.JO9_ROLE_UI_ROOT||'G:/somi/JO9sa/tools/girls-image-checklist',source=fs.readFileSync(root+'/catalog-girls-checklist.js','utf8');
function role(refs,known){const start=source.indexOf('  function role('),end=source.indexOf('  function evaluation(',start),scope={normal:p=>String(p||'').toLowerCase(),exists:p=>known.includes(p),full:c=>c.refs.indpack_title||c.refs.fullimage||'',c:{refs},spec:['secretary','비서','fullsecretary','indpack_secr']};vm.runInNewContext(source.slice(start,end)+'\nresult=role(c,spec);',scope);return scope.result;}
test('추가팩만 등록된 비서 복장을 옛 필드가 비었다는 이유로 미연결 처리하지 않는다',()=>{
 const r=role({indpack_secr:'secr',indpack_title:'base'},['secr','base']);a.equal(r.state,'ok');a(!r.text.includes('연결 필요'));
});
test('파일 누락과 상태 변형 누락은 기존처럼 표시한다',()=>{
 a.equal(role({indpack_secr:'missing'},[]).state,'broken');const r=role({indpack_secr:'secr',indpack_secr_horny:'absent'},['secr']);a.equal(r.moodMissing,true);a(r.text.includes('상태 변형 누락'));
});
test('옛 등록·기본 전신 중복·미등록 분류는 유지한다',()=>{
 a.equal(role({fullsecretary:'secr'},['secr']).state,'ok');a.equal(role({indpack_secr:'base',indpack_title:'base'},['base']).state,'same');a.equal(role({},[]).state,'empty');
});
test('1031 원장의 비서·도미나 메뉴 연결 판정도 추가팩 등록을 인정한다',()=>{
 const d=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8')),c=d.characters.find(x=>x.id===1031);for(const key of ['secretary','domina']){a.equal(c.effectiveRoles[key].menuAvailable,true);a.equal(c.effectiveRoles[key].menuIssue,false);}
});
test('이전 개별 등록 내용이 없는 캐릭터에는 빈 경고를 만들지 않는다',()=>{
 a(!source.includes('이전 개별 장면 등록 · 현재 행동 화면과 연결 확인 필요'));a(source.includes('if(legacyFields.length)'));
});
