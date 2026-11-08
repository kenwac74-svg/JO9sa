'use strict';
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const root=process.env.JO9_REVIEW_ROOT||'G:/somi/JO9sa/tools/text-workshop';
const core=require(root+'/core.cjs'),imp=require(root+'/script-import.cjs');
function doc(body){return core.parse(core.serialize({lines:['QSPGAME','','',core.shift('1',-5),core.shift('event',-5),'',core.shift(body,-5),core.shift('0',-5),'']}));}
const old=doc("$text[1]='[직원]<br> 안녕하세요 <<$master_name>>.</div>'"),entry=core.entries(old)[0],record={hash:old.hash,map:{'S1-P1':entry}};
const text='---- [S1-P1] ----\n직원: 반갑습니다 〈$master_name〉.';
test('채팅에서 이스케이프된 구분선만 복원하고 대사 속 역슬래시는 유지한다',()=>{
 const r=imp.parse('\\==== [S1] event ====\n\\---- [S1-P1] ----\\\n직원: G:\\자료\\원고');a.equal(r.blocks.get('S1-P1'),'직원: G:\\자료\\원고');a.equal(r.normalizedMarkers,2);
});
test('인식한 페이지가 0개인 입력은 반영 가능 상태로 오인하지 않는다',()=>{a.throws(()=>imp.prepare(old,record,'번호 없는 원고'),/페이지|번호/);});
test('원본 치환변수의 누락과 추가 식을 구문검사 전에 차단한다',()=>{
 a.throws(()=>imp.prepare(old,record,'---- [S1-P1] ----\n직원: 반갑습니다.'),/변수/);
 a.throws(()=>imp.prepare(old,record,text+' 〈$extra〉'),/변수/);
});
test('따옴표가 있는 각색본은 문자열로 복원하고 깨진 치환문/태그는 거부한다',()=>{
 const p=imp.prepare(old,record,text+" '환영합니다'");a.equal(core.parse(p.raw).locations.length,1);a(p.chosen[0].new.includes("'환영합니다'"));
 a.throws(()=>imp.prepare(old,record,text+' <font color="red"'),/태그/);
});
test('구 QSP 연결은 명시 재대조 때만 동일 원문을 유일하게 찾아 연결한다',()=>{
 const changed=doc("$unrelated='새 내용'\n$text[1]='[직원]<br> 안녕하세요 <<$master_name>>.</div>'");
 a.throws(()=>imp.prepare(changed,record,text),/QSP/);
 const r=imp.revalidateRecord(changed,record);a.equal(r.hash,changed.hash);a.notEqual(r.map['S1-P1'].start,entry.start);a(imp.prepare(changed,r,text).raw);
 a.throws(()=>imp.revalidateRecord(doc("$text[1]='[직원]<br> 이미 수동 수정됨.</div>'"),record),/원문|충돌/);
 a.throws(()=>imp.revalidateRecord(doc("$a='[직원]<br> 안녕하세요 <<$master_name>>.</div>'\n$b='[직원]<br> 안녕하세요 <<$master_name>>.</div>'"),record),/중복|유일/);
});
test('넘침 판정은 가로와 세로를 모두 검사하고 크기/글자를 제한한다',()=>{
 const ui=require(root+'/script-review.js');a.deepEqual(ui.overflow({clientWidth:700,scrollWidth:700,clientHeight:400,scrollHeight:401}),{horizontal:false,vertical:true});a.equal(ui.overflow({clientWidth:700,scrollWidth:702,clientHeight:400,scrollHeight:400}).horizontal,true);a.deepEqual(ui.dimensions({width:0,height:'x',font:99}),{width:320,height:480,font:36});
 a.equal(ui.displayText('직원: 반가워요 〈$master_name〉.'),'직원\n반가워요 〈$master_name〉.');
});
test('기존 반영 UI는 각본 패널에 한 번만 있으며 원본/수정TXT와 검토설정이 있다',()=>{
 const html=fs.readFileSync(root+'/index.html','utf8');const start=html.indexOf('id="workshopScriptPanel"'),end=html.indexOf('id="workshopEditTools"');a(html.slice(start,end).includes('id="scriptImport"'));a.equal((html.match(/id="scriptImport"/g)||[]).length,1);
 for(const id of ['scriptOriginalFile','scriptAdaptedFile','scriptImportId','scriptRevalidate','scriptLayoutWidth','scriptLayoutHeight','scriptLayoutFont','scriptPreview','scriptApply'])a(html.includes('id="'+id+'"'),id);
});
test('검토 중 입력 변경은 늦은 응답을 무효화한다',()=>{
 const gate=require(root+'/script-review.js').createGate();const request=gate.begin();a(gate.current(request));gate.invalidate();a.equal(gate.current(request),false);a(gate.current(gate.begin()));
});
