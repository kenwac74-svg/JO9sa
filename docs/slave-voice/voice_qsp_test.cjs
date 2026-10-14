// 아침 대사 조각 조립(감정·기억·표현 단계·반복 방지)을 QSP 코드로 짜서 WASM QSP 엔진에서 돌려 보는 시험
const path=require('path');
const vendor=process.env.QSP_WASM||path.resolve(__dirname,'../../audits/reward-diagnostic/vendor-legacy/package');
const {initQspEngine}=require(path.join(vendor,'dist/node/wasm-engine.cjs'));
const shift=s=>[...s].map(c=>String.fromCharCode((c.charCodeAt(0)-5)&65535)).join('');
function game(l){let f=['QSPGAME','','',shift(String(l.length))];for(const[n,c]of l)f.push(shift(n),'',shift(c.replace(/\r?\n/g,'\r\n')),shift('0'));let b=Buffer.from(f.join('\r\n')+'\r\n','utf16le');return b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}
// 대사 조각 표(데이터): $vf['감정|단계'] 안에 '/'로 구분
const voiceData=`
$vg['high|good']='좋은 아침이에요, 주인님./주인님, 일어나셨어요?/오늘도 시중들 준비가 됐어요, 주인님.'
$vg['high|bad']='……안녕히 주무셨어요, 주인님./부르셨어요, 주인님?/주인님, 오셨어요.'
$vg['mid|good']='아, 주인님. 아침이네요./일어나셨네요./오셨어요?'
$vg['mid|bad']='……아침이에요./네, 일어났어요./……주인님.'
$vb['sore']='몸이 아직 욱신거려요./움직일 때마다 결려요./어디 하나 안 아픈 데가 없네요.'
$vb['tired']='잠을 거의 못 잤어요./눈꺼풀이 무거워요./조금 지쳤어요.'
$vf['fear|reveal']='{when} 일이 자꾸 떠올라요. 또 그러실 건가요?/{when}처럼 화나시게 하지 않을게요./밤새 {when} 생각이 나서 잠을 설쳤어요.'
$vf['fear|conceal']='*목소리가 아주 조금 떨립니다./*그녀는 당신과 눈을 마주치지 않습니다./아무렇지도 않아요.'
$vf['unease|reveal']='{who}…… 그 사람, 또 오나요?/{when} 그 손님, 다시는 안 왔으면 좋겠어요./{who}가 나가면서 한 말이 계속 마음에 걸려요.'
$vf['unease|conceal']='*손님 얘기가 나오자 그녀가 화제를 돌립니다./*그녀는 문 쪽을 한 번 흘끗 봅니다./괜찮아요.'
`;
const voice=`
! 조각 고르기: args[0]=조각 묶음 문자열, args[1]=반복 방지 키. 최근 2일 안에 쓴 조각은 피한다
$v_pool = $args[0]
v_n = 0
:split
v_cut = instr($v_pool, '/')
if v_cut = 0:
	$v_item[v_n] = $v_pool
	v_n += 1
else
	$v_item[v_n] = mid($v_pool, 1, v_cut - 1)
	$v_pool = mid($v_pool, v_cut + 1)
	v_n += 1
	jump 'split'
end
v_try = 0
:retry
v_i = rand(0, v_n - 1)
v_try += 1
if v_used[$args[1] + '|' + $str(v_i)] > 0 and day - v_used[$args[1] + '|' + $str(v_i)] <= 2 and v_try < 12: jump 'retry'
v_used[$args[1] + '|' + $str(v_i)] = day
$result = $v_item[v_i]
`;
const morning=`
! 아침 한마디 조립
$v_out = ''
if slave['obedience'] >= 65: $v_tier = 'high' else $v_tier = 'mid'
if slave['v_mood'] >= 0: $v_tone = 'good' else $v_tone = 'bad'
$v_out += '“' + func('voice_pick', $vg[$v_tier + '|' + $v_tone], 'g') + '”'
if $slave['v_body'] ! '': $v_out += ' “' + func('voice_pick', $vb[$slave['v_body']], 'b') + '”'
! 가장 센 감정
$v_top = ''
v_topval = 0
if slave['feel_fear'] > v_topval: v_topval = slave['feel_fear'] & $v_top = 'fear'
if slave['feel_unease'] > v_topval: v_topval = slave['feel_unease'] & $v_top = 'unease'
if v_topval >= 25:
	if slave['trust'] >= 40: $v_mode = 'reveal' else $v_mode = 'conceal'
	v_gap = day - slave['feel_' + $v_top + '_day']
	$when = '며칠 전'
	if v_gap = 2: $when = '그저께'
	if v_gap <= 1: $when = '어제'
	$who = $slave['feel_' + $v_top + '_who']
	$v_line = func('voice_pick', $vf[$v_top + '|' + $v_mode], 'f' + $v_top + $v_mode)
	$v_line = replace(replace($v_line, '{when}', $when), '{who}', $who)
	if mid($v_line, 1, 1) = '*': $v_out += ' (' + mid($v_line, 2) + ')' else $v_out += ' “' + $v_line + '”'
end
$result = $v_out
`;
const start=`
${voiceData}
day = 1
slave['obedience'] = 70
slave['trust'] = 50
slave['v_mood'] = -1
`;
(async()=>{
 const api=await initQspEngine(path.join(vendor,'dist/qsp-engine.wasm'));const errors=[];api.on('error',e=>errors.push(e));
 for(const ev of ['msg','input','wait','play_file','close_file','is_play','version','menu'])api.on(ev,(...a)=>{const cb=a.find(x=>typeof x==='function');if(cb)cb(ev==='input'?'':ev==='is_play'?false:ev==='version'?'5.7.0':-1)});
 api.openGame(game([['start',start],['voice_pick',voice],['voice_morning',morning]]),true);api.restartGame();
 const run=c=>{api.execCode(c);if(errors.length){console.log('ERR',JSON.stringify(errors));process.exit(1)}};
 // 1일: 손님 접대 기록 → 2일: 엄한 처벌 기록 → 매일 아침 대사
 const days=[
  ["slave['feel_unease']=55 & slave['feel_unease_day']=day & $slave['feel_unease_who']='흉터 있는 용병' & $slave['v_body']='tired'"],
  ["slave['feel_unease']=slave['feel_unease']*65/100 & slave['feel_fear']=70 & slave['feel_fear_day']=day & $slave['feel_fear_who']='주인님' & $slave['v_body']='sore'"],
  ["slave['feel_fear']=slave['feel_fear']*75/100 & slave['feel_unease']=slave['feel_unease']*65/100 & $slave['v_body']=''"],
  ["slave['trust']=30 & slave['feel_fear']=slave['feel_fear']*75/100 & slave['feel_unease']=0 & slave['feel_fear']=60 & slave['feel_fear_day']=day"],
  ["slave['feel_fear']=slave['feel_fear']*75/100"],
 ];
 for(const [ev] of days){
   run(ev); run('day += 1'); run("$m = func('voice_morning')");
   console.log(api.readVariable("day")+"일째", "top=",api.readVariable("$v_top"),api.readVariable("v_topval"),"fear=",api.readVariableByKey("slave","feel_fear"),"| ",api.readVariable("$m"));
 }
 console.log('QSP',api.version(),'오류 0');
})().catch(e=>{console.error(e);process.exit(1)});
