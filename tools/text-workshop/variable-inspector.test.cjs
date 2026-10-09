'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),core=require('./core.cjs'),scenes=require('./scenes.cjs'),inspector=require('./variable-inspector.cjs');
function fixture(defs){const lines=['QSPGAME','header','',core.shift(String(defs.length),-5)];for(const [n,b]of defs)lines.push(core.shift(n,-5),'',core.shift(b,-5),core.shift('0',-5));lines.push('');return core.parse(Buffer.from(lines.join('\r\n'),'utf16le'));}
function inspect(d,text,usageId){const es=core.entries(d),e=es.find(e=>e.text===text),nav=scenes.buildNavigator(d,es),c=nav.context({...e,hash:d.hash},undefined,'text',usageId);return inspector.create(d,es).inspect(c);}
test('치환문, 조건별 설정 원문, 문자열 속 가짜 대입을 구분하고 QSP를 보존한다',()=>{
 const d=fixture([['town',`$name='이름'
if town = 1:
 if mood < 0:
  coins = 3
 else
  coins = 7
 end
 *pl '대사 <<$name>> <<coins>> <<$items[index]>> <<iif(mood < 0, ''>>'', ''x'')>>'
 *pl 'coins = 999 는 그냥 대사'
 ! coins = 888
end`]]),before=core.serialize(d),x=inspect(d,'대사 <<$name>> <<coins>> <<$items[index]>> <<iif(mood < 0, \'>>\', \'x\')>>');
 assert.equal(x.substitutions.length,4);assert(x.variables.some(v=>v.name==='$name'&&v.type==='string'));assert(x.variables.some(v=>v.name==='coins'&&v.type==='number'));
 assert(x.variables.some(v=>v.name==='$items[index]'));assert(x.variables.some(v=>v.name==='index'));assert(!x.variables.some(v=>v.name==='iif'));assert(!x.variables.some(v=>v.name==='그'||v.name==='외'));
 const coin=x.variables.find(v=>v.name==='coins');assert.equal(coin.definitionTotal,2);assert(coin.definitions.every(v=>!v.code.includes('999')&&!v.code.includes('888')));assert(x.conditions.some(v=>v.code.includes('if mood < 0:')));assert.deepEqual(core.serialize(d),before);
});
test('배열 정의 위치와 실제 copyarr 사용 장면의 조건 및 상태 코드를 함께 표시한다',()=>{
 const d=fixture([['#texts',`if ready = 1:
 $greeting[1]='처음 <<$who>>'
end`],['shop',`if hero_choice < 100:
if shop = 2:
 reputation += 1
 copyarr '$text', '$greeting'
end
end`]]),x=inspect(d,'처음 <<$who>>');assert.equal(x.scope.location,'shop');assert.equal(x.scope.title,'shop = 2');assert(x.conditions.some(c=>c.location==='#texts'&&c.code.includes('ready')));assert(x.conditions.some(c=>c.location==='shop'&&c.code.includes('shop = 2')));assert(x.conditions.some(c=>c.location==='shop'&&c.code.includes('hero_choice < 100')));assert(x.variables.some(v=>v.name==='hero_choice'));assert(x.variables.some(v=>v.name==='reputation'&&v.uses.some(u=>u.code.includes('reputation += 1'))));
});
test('특수 행동, dynamic, 중괄호 및 EXEC 속성의 대입은 지연 실행으로 표시한다',()=>{
 const d=fixture([['room',`if room = 1:
 $special_action[2]='coins += 1'
 dynamic 'if trust > 0: reputation = 2'
 $later = {
  energy = 4
 }
 *pl '현재 대사 <<coins>>'
 *pl '<a href="exec: favor += 1 & gt ''room''">선택</a>'
end`]]),x=inspect(d,'현재 대사 <<coins>>');for(const name of ['coins','reputation','energy','favor']){const v=x.variables.find(v=>v.name===name);assert(v,name);assert(v.definitions.some(d=>d.kind==='deferred'),name);}
 assert(x.notice.includes('현재값을 뜻하지'));assert(!x.variables.some(v=>v.name==='gt'));
});
test('다중행 주석 속 가짜 코드 제외, 정의 수 및 출력 상한 유지',()=>{
 const defs=Array.from({length:20},(_,i)=>`coins[${i}] = ${i}`).join('\n'),d=fixture([['defs',`! '주석 시작
coins = 999
끝'
${defs}`],['room',`if room = 1:
 *pl '수량 <<coins[10]>>'
end`]]),x=inspect(d,'수량 <<coins[10]>>'),v=x.variables.find(v=>v.name==='coins[10]');assert.equal(v.definitionTotal,20);assert.equal(v.definitions.length,12);assert(v.definitions[0].code.includes('coins[10]'));assert(!v.definitions.some(d=>d.code.includes('999')));
});
test('다중행 대입 문자열을 잘라 읽어도 대사 단어를 변수로 오인하지 않는다',()=>{
 const text='여자들은 성실하게 안내한다.\n계속되는 일반 대사이고 false_coins = 999 도 코드가 아니다.',d=fixture([['room',`if room = 1:
 $text[1]='${text}'
 $text[2]='다음 대사'
 coins = 5
end`]]),x=inspect(d,text);
 for(const name of ['여자들은','성실하게','안내한다','계속되는','일반','대사이고','false_coins'])assert(!x.variables.some(v=>v.name===name),name);
 assert(x.variables.some(v=>v.name==='coins'));assert(x.variables.some(v=>v.name==='$text[1]'));
});
