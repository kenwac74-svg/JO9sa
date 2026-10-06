const test=require('node:test'),assert=require('node:assert/strict'),c=require('./core.cjs');
function doc(){return c.parse(Buffer.from(['QSPGAME','header','',c.shift('1',-5),c.shift('test',-5),'',c.shift("*pl '안녕 <<$name>><br>순번 <<count>>'\n*pl '상품 <<$stock[1]>>'\n*pl '숫자 <<name>>'",-5),c.shift('0',-5),''].join('\r\n'),'utf16le'));}
test('다른 대사의 표시 이름 복원, 배열과 숫자 변수 보존',()=>{const d=doc();assert.equal(c.restoreDisplayTokens(d,'상품 〈stock[1]〉 · 〈count〉'), '상품 <<$stock[1]>> · <<count>>');});
test('표시 이름 충돌은 선택 원문으로 결정하거나 거부',()=>{const d=doc();assert.equal(c.restoreDisplayTokens(d,'새 〈name〉','안녕 <<$name>>'),'새 <<$name>>');assert.throws(()=>c.restoreDisplayTokens(d,'새 〈name〉'),/여러 개/);});
test('일반 괄호와 기존 치환문은 그대로 유지',()=>{const d=doc();assert.equal(c.restoreDisplayTokens(d,'〈일반 문구〉 <<$name>>'),'〈일반 문구〉 <<$name>>');});
test('반영 준비에서 복원한 코드를 저장하고 원래 범위 유지',()=>{const d=doc(),e=c.entries(d).find(e=>e.text.includes('순번'));const p=c.prepare(d,{...e,hash:d.hash},'반갑습니다 〈name〉, 〈stock[1]〉, 〈count〉');assert.equal(p.replacement,'반갑습니다 <<$name>>, <<$stock[1]>>, <<count>>');assert.ok(c.entries(c.parse(p.raw)).some(x=>x.text===p.replacement));});
