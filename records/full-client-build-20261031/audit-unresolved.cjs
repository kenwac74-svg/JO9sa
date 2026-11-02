'use strict';
// Read only WORK/JO9O; outputs only to this workspace directory.
const fs=require('fs'),path=require('path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const G='G:/somi/Jack O Nine Tails v2.4_work/game',O='G:/somi/JO9O/game',raw=fs.readFileSync(G+'/jack.qsp'),doc=c.parse(raw),meta=JSON.parse(fs.readFileSync('G:/somi/JO9sa/records/scene-image-conditions-20261030/metadata.json','utf8'));
const proposals={
 'scene\\slaughter_work2.png':['scene/slaughter_work_start.png','fallback-only','115441/61134 use a one-page slaughter-and-payment description; existing start image is closest existing phase, not proven identical lost artwork.'],
 'scene/coldef1':['scene/kikudef.png','user-supplied-pending','Root handles the three user-supplied result slots separately.'],
 'scene/coldef2':['scene/kikudef.png','user-supplied-pending','Root handles the three user-supplied result slots separately.'],
 'scene/coldef3':['scene/kikudef.png','user-supplied-pending','Root handles the three user-supplied result slots separately.'],
 'scene\\pope.png':['characters/pope.png','same-role-alias','Pope dialogue pages in interactions 6218/6219.'],
 'scene\\portal.png':['bg/fogs_portal.png','same-role-alias','Portal scene pages in interaction 6220.'],
 'scene\\vatican_paladin.png':['bg/vatican_paladin.png','same-role-alias','Paladin event fight preparation in interaction 6215.'],
 'scene\\strazhnik.png':['bg/strazhnik.png','same-role-alias','Portal guardian event fight preparation in interaction 6216.'],
 'scene\\others\\Jasmine23.png.':['scene/others/jasmine23.png','trailing-dot-path-error','Two active image slots in interaction 30117. Exact trailing-dot existsSync returns false; normal file exists. Do not assume engine normalizes this.'],
 'scene\\others\\Raja1.png.':['scene/others/raja1.png','trailing-dot-path-error','One active image slot in interaction 30117. Exact trailing-dot existsSync returns false; normal file exists. Do not assume engine normalizes this.'],
 'scene\\item\\item_':[null,'placeholder-definition','Empty item key definition; no normal image slot requests this basename directly.'],
 'scene\\item\\weapons\\one_handed\\sample':[null,'sample-definition','Combat item key образец is explicitly SAMPLE. Definition alone does not establish a normal display path.'],
 'scene\\blindfold_5':['scene/blindfold.png','fallback-only','Female protagonist sex_interaction=21 explicitly RAND(1,8), but original and WORK contain only four images.'],
 'scene\\blindfold_6':['scene/blindfold_2.png','fallback-only','Existing first four images can be repeated as Full-only compatibility placeholders; not newly authored variants.'],
 'scene\\blindfold_7':['scene/blindfold_3.png','fallback-only','Existing first four images can be repeated as Full-only compatibility placeholders; not newly authored variants.'],
 'scene\\blindfold_8':['scene/blindfold_4.png','fallback-only','Existing first four images can be repeated as Full-only compatibility placeholders; not newly authored variants.']
};
const rows=[];
for(const expr of [...new Set(meta.unresolved.map(x=>x.expression))]){
 const from=meta.unresolved.filter(x=>x.expression===expr),refs=[];
 for(const name of [...new Set(from.map(x=>x.location))]){const l=doc.locations.find(x=>x.name===name),b=c.shift(doc.lines[l.body],5),lines=b.split('\r\n');for(const lit of c.literals(b))if(lit.text===expr){let at=lit.line-1;while(at>=0&&!/^\s*IF (?:interaction_city|sex_interaction)\s*=/i.test(lines[at]))at--;refs.push({location:name,line:lit.line,event:at>=0?lines[at].trim():null,statement:lines[lit.line-1].trim()});}}
 const [candidate,classification,reason]=proposals[expr],rel='content/pic/'+expr.replaceAll('\\','/')+(/\.(png|gif|jpg|jpeg|webp)\.?$/i.test(expr)?'':'.png'),source=candidate?'content/pic/'+candidate:null;
 let dims=null;if(source&&fs.existsSync(G+'/'+source)){const b=fs.readFileSync(G+'/'+source);if(b.subarray(1,4).toString()==='PNG')dims=[b.readUInt32BE(16),b.readUInt32BE(20)];}
 rows.push({expression:expr,requiredPath:rel,originalMetadataReferences:from.length,currentActiveReferences:refs.length,refs,workExactExists:fs.existsSync(G+'/'+rel),originalExactExists:fs.existsSync(O+'/'+rel),classification,reason,candidate:source,candidateExists:source?fs.existsSync(G+'/'+source):false,candidateDimensions:dims});
}
const report={readOnly:true,qspSha256:c.hash(raw),metadataInputSha256:meta.qspSha256,metadataUnresolvedReferences:meta.unresolved.length,uniqueExpressions:rows.length,rows,limits:['Static exact-literal evidence, not full quest execution.','Fallback proposals do not prove identity with a missing original artwork.','Trailing-dot paths require an actual native rendering check; neither original nor WORK has those exact files.','No product file has been changed.']};fs.writeFileSync(__dirname+'/unresolved-resource-review.json',JSON.stringify(report,null,2));
fs.writeFileSync(__dirname+'/unresolved-resource-review.md',[
'# 미해결 scene 참조 26건 재점검','',
'기존 metadata의 26건은 16종 경로다. 현재 QSP에서도 주석이 아닌 실제 문자열 26건을 확인했다. 이 중 2건은 빈 아이템/샘플 아이템 정의이고, 나머지는 직접 이미지 슬롯 또는 난수 분기다. JO9O 동일 상대경로도 모두 없으므로 원본 파일 복원만으로 해결되지 않는다.','',
'- 사용자 공급 예정 coldef1/2/3: 3경로·3참조. root의 별도 임시 호환 사본 처리 범위다.',
'- 명확한 용도별 경로 호환: pope(6참조)→characters/pope.png, portal(4참조)→bg/fogs_portal.png, vatican_paladin→bg/vatican_paladin.png, strazhnik→bg/strazhnik.png. 후보 모두 현재 WORK에 795×596 PNG로 존재한다. 해당 이벤트는 각각 교황 대면6218/6219, 포털6220, 성기사 준비6215, 가디언 준비6216이다.',
'- slaughter_work2(2참조): 115441/61134의 목을 베고 돈을 받는 1페이지 장면. 별도 가공 과정은 start→end→result 순으로 이미지를 사용한다. 기존 start 컷이 설명 시점상 가장 가까운 fallback이나 잃어버린 원본과 같은 그림이라는 증거는 아니다.',
'- blindfold_5~8(4참조): 여주인공 sex_interaction=21이 명시적으로 RAND(1,8)을 사용하지만 실제 원본/WORK는 blindfold, _2, _3, _4만 있다. Full-only 1~4 반복 사본으로 슬롯 공백은 없앨 수 있으나 신규 다양성이 아니라 호환 fallback으로 기록해야 한다.',
'- Jasmine23.png.(2참조), Raja1.png.(1참조): interaction_city=30117의 이미지100/101/102에 끝 점이 남아 있다. 정상 jasmine23.png/raja1.png는 두 게임에 모두 있고 exact trailing-dot 경로 existsSync는 false다. Windows/Qt가 자동 보정한다고 단정하지 않는다. 파일만으로 보완하려면 끝 점 경로의 생성/렌더링을 별도로 검증해야 하며 코드 수정은 이번 조사에서 하지 않았다.',
'- item_(1), weapons/one_handed/sample(1): 빈 item key와 SAMPLE 장비 정의다. 정상 장면의 직접 표시가 아니라 정의이므로 배포 필수 이미지로 임의 생성하지 않는다. 샘플이 실제로 선택되는 일반 경로는 확인하지 못했다.','',
'추가로 최신 캣파이트 catfdef1/catdef2는 이전 metadata 이후 추가된 2경로라 26건에 포함되지 않는다. root가 사용자 공급 전 호환 이미지로 별도 처리한다.','',
'검증 한계: QSP 문자열/이벤트 조건/현재 파일·치수/JO9O 비교를 수행했고 전체 퀘스트를 실행하지는 않았다. 입력 파일은 수정하지 않았다. 상세 현재 줄번호와 정확한 경로는 JSON에 있다.',''].join('\n'));
console.log(JSON.stringify({unique:rows.length,refs:rows.reduce((n,x)=>n+x.currentActiveReferences,0),classifications:rows.map(x=>({path:x.requiredPath,class:x.classification,refs:x.currentActiveReferences}))}));
