'use strict';

const OPTIONS=Object.freeze({
 moralityMin:-10,moralityMax:10,moralityStep:0.5,moralityExtremes:Object.freeze([-9999,9999]),moneyMax:2147483647,
 ranks:Object.freeze(['조합 신입','조합 말단','조합 일원','조합 인사','조합 중역','조합 이사'].map((label,value)=>Object.freeze({value,label}))),
 reputations:Object.freeze(['알려지지 않음','희미하게 알려짐','입소문이 남','잘 알려짐','유명함','로마의 전설'].map((label,value)=>Object.freeze({value,label})))
});
const NAMES=['DATA','LOCALS','SUPPLEMENT','REGISTERED_FILTER','REGISTERED_AUTO','WINDOWS_FILTER','WINDOWS_AUTO','SELECT'];
const id=name=>'JO9_CUT_CONDITIONS_'+name+'_20261101';
const JSON_MARK='! JO9 IMAGE CUT CONDITIONS JSON ';
const quote=s=>"'"+s.replaceAll("'","''")+"'";
function object(value,keys,what){
 if(!value||typeof value!=='object'||Array.isArray(value)||![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw Error(what+' 형식을 확인하세요.');
 if(Object.keys(value).some(k=>!keys.includes(k)))throw Error(what+'에 지원하지 않는 항목이 있습니다.');
}
function imagePath(value){
 if(typeof value!=='string'||!value||/[\x00-\x1f\x7f:*?"<>|'`%&!${}]/.test(value))throw Error('이미지 경로의 문자와 형식을 확인하세요.');
 const p=value.replaceAll('\\','/').toLowerCase();
 if(!/^content\/pic\/(bg|characters|scene)\/.+\.(png|jpe?g|gif|webp|bmp)$/.test(p)||p.split('/').some(s=>!s||s==='.'||s==='..'))throw Error('bg·characters·scene 안의 이미지 경로를 선택하세요.');
 return p;
}
function cutNumber(path){
 const m=path.match(/ \(([2-9]|[1-9][0-9]+)\)(\.[^.\/]+)$/);
 if(!m||!Number.isSafeInteger(Number(m[1]))||Number(m[1])>2147473647)throw Error('(2), (3) 형식의 추가 컷을 선택하세요.');
 return Number(m[1]);
}
function stage(value,what){
 if(value===null||value===undefined)return null;
 if(!Number.isInteger(value)||value<0||value>5)throw Error(what+'의 드롭다운 값을 확인하세요.');
 return value;
}
function moralityValue(value){
 return Number.isFinite(value)&&(OPTIONS.moralityExtremes.includes(value)||(value>=OPTIONS.moralityMin&&value<=OPTIONS.moralityMax&&Number.isInteger(value*2)));
}
// JO9 MOD START IMAGE_REFERENCE_CONDITIONS_20261109
function normalizeCondition(raw){
 object(raw,['base','path','morality','money','rank','reputation'],'등장 조건');
 let morality=null,money=null;
 if(raw.morality!==null&&raw.morality!==undefined){
  object(raw.morality,['min','max'],'cruel & mercy 범위');
  const {min,max}=raw.morality;
  if(!moralityValue(min)||!moralityValue(max)||min>max)throw Error('cruel & mercy는 -9999, -10~+10 사이의 0.5 단위 값, +9999 중에서 최솟값과 최댓값을 지정하세요.');
  morality={min:Object.is(min,-0)?0:min,max:Object.is(max,-0)?0:max};
 }
 if(raw.money!==null&&raw.money!==undefined){
  object(raw.money,['op','value'],'보유금 조건');
  const {op,value}=raw.money;
  if(!['ge','le'].includes(op)||!Number.isSafeInteger(value)||value<0||value>OPTIONS.moneyMax)throw Error('보유금은 0~2,147,483,647 사이의 정수와 이상·이하 중 하나로 지정하세요.');
  money={op,value};
 }
 const rank=stage(raw.rank,'계급'),reputation=stage(raw.reputation,'평판');
 if(morality===null&&money===null&&rank===null&&reputation===null)throw Error('조건을 하나 이상 선택하세요.');
 return {morality,money,rank,reputation};
}
function conditionExpression(rule){
 const conditions=[];
 if(rule.morality)conditions.push('(2 * jo9_cruel_mercy + jo9_cruel_mercy_half) >= '+rule.morality.min*2,'(2 * jo9_cruel_mercy + jo9_cruel_mercy_half) <= '+rule.morality.max*2);
 if(rule.money)conditions.push('sparks '+(rule.money.op==='ge'?'>=':'<=')+' '+rule.money.value);
 if(rule.rank!==null)conditions.push('guild_reputation = '+rule.rank);
 if(rule.reputation!==null)conditions.push('brand_reputation = '+rule.reputation);
 return conditions.join(' and ');
}
// JO9 MOD END IMAGE_REFERENCE_CONDITIONS_20261109
function normalizeRules(input){
 if(!Array.isArray(input))throw Error('조건 목록은 배열이어야 합니다.');
 const seen=new Set();
 const result=input.map(raw=>{
  object(raw,['base','path','morality','money','rank','reputation'],'등장 조건');
  const base=imagePath(raw.base),path=imagePath(raw.path),cut=cutNumber(path);
  if(/ \([0-9]+\)\.[^.\/]+$/.test(base)||path.replace(/ \([0-9]+\)(\.[^.\/]+)$/,'$1')!==base)throw Error('기본 이미지와 추가 컷의 이름·폴더·확장자가 일치해야 합니다.');
  if(seen.has(path))throw Error('같은 추가 컷의 조건이 중복되었습니다.');
  seen.add(path);
  const {morality,money,rank,reputation}=normalizeCondition(raw);
  return {base,path,morality,money,rank,reputation};
 });
 return result.sort((a,b)=>a.base.localeCompare(b.base)||cutNumber(a.path)-cutNumber(b.path)||a.path.localeCompare(b.path));
}
function inspectBlocks(body){
 if(typeof body!=='string')throw Error('QSP 본문이 문자열이 아닙니다.');
 const matches=[...body.matchAll(/^[ \t]*! JO9 MOD (START|END) (JO9_CUT_CONDITIONS_[A-Z_]+_20261101)[ \t]*\r?$/gm)];
 const ranges=[],found=new Set();
 for(let i=0;i<matches.length;i+=2){
  const start=matches[i],end=matches[i+1],name=NAMES.find(n=>id(n)===start[2]);
  if(!name||start[1]!=='START'||!end||end[1]!=='END'||end[2]!==start[2]||found.has(name))throw Error('등장 조건 코드의 주석 경계가 손상되거나 중복되었습니다.');
  found.add(name);
  let finish=end.index+end[0].length;
  if(body[finish]==='\n')finish++;
  ranges.push({start:start.index,end:finish,name,text:body.slice(start.index,finish)});
 }
 const metadata=[...body.matchAll(/^[ \t]*! JO9 IMAGE CUT CONDITIONS JSON ([^\r\n]*)\r?$/gm)];
 if(!matches.length){if(metadata.length)throw Error('등장 조건 메타데이터의 코드 경계를 찾을 수 없습니다.');return {ranges,rules:[]};}
 if(found.size!==NAMES.length||metadata.length!==1||!ranges.find(x=>x.name==='DATA'&&metadata[0].index>x.start&&metadata[0].index<x.end))throw Error('등장 조건 코드 또는 메타데이터 일부가 누락되었습니다.');
 let raw;try{raw=JSON.parse(metadata[0][1]);}catch{throw Error('등장 조건 메타데이터 JSON이 손상되었습니다.');}
 return {ranges,rules:normalizeRules(raw)};
}
function readRules(body){return inspectBlocks(body).rules;}
function removeBlocks(body,blocks){for(const r of [...blocks].reverse())body=body.slice(0,r.start)+body.slice(r.end);return body;}
function installBaseBody(body){
 if(typeof body!=='string')throw Error('QSP 본문이 문자열이 아닙니다.');
 const eol=body.includes('\r\n')?'\r\n':'\n',marker='JO9_CUT_CONDITION_CORE_20261101';
 const doublePattern='\\s[sS][rR][cC]\\s*=\\s*"([^"]+)"',singlePattern="\\s[sS][rR][cC]\\s*=\\s*'([^']+)'";
 const lines=[
  '! JO9 MOD START '+marker,
  "if $args[0] = 'jo9_condition_html':",
  ' local $jo9_ic_html, $jo9_ic_tail, $jo9_ic_tag, $jo9_ic_attr, $jo9_ic_src, $jo9_ic_newsrc, $jo9_ic_newattr, $jo9_ic_newtag, jo9_ic_pos, jo9_ic_next',
  ' $jo9_ic_html = $args[1]',
  ' jo9_ic_pos = 1',
  ' :jo9_condition_html_scan',
  " jo9_ic_next = instr($lcase($mid($jo9_ic_html, jo9_ic_pos)), '<img')",
  ' if jo9_ic_next > 0:',
  '  jo9_ic_next += jo9_ic_pos - 1',
  '  $jo9_ic_tail = $mid($jo9_ic_html, jo9_ic_next)',
  "  $jo9_ic_tag = $strfind($jo9_ic_tail, '^<[iI][mM][gG]\\b[^>]*>')",
  "  if $jo9_ic_tag ! '':",
  '   $jo9_ic_attr = $strfind($jo9_ic_tag, '+quote(doublePattern)+')',
  '   $jo9_ic_src = $strfind($jo9_ic_tag, '+quote(doublePattern)+', 1)',
  "   if $jo9_ic_attr = '':",
  '    $jo9_ic_attr = $strfind($jo9_ic_tag, '+quote(singlePattern)+')',
  '    $jo9_ic_src = $strfind($jo9_ic_tag, '+quote(singlePattern)+', 1)',
  '   end',
  "   if $jo9_ic_attr ! '':",
  "    $jo9_ic_newsrc = func('interior_change', 'jo9_condition_path', $jo9_ic_src)",
  '    if $jo9_ic_newsrc ! $jo9_ic_src:',
  '     $jo9_ic_newattr = $replace($jo9_ic_attr, $jo9_ic_src, $jo9_ic_newsrc)',
  '     $jo9_ic_newtag = $replace($jo9_ic_tag, $jo9_ic_attr, $jo9_ic_newattr)',
  '     $jo9_ic_html = $mid($jo9_ic_html, 1, jo9_ic_next - 1) + $jo9_ic_newtag + $mid($jo9_ic_html, jo9_ic_next + len($jo9_ic_tag))',
  '     $jo9_ic_tag = $jo9_ic_newtag',
  '    end',
  '   end',
  '   jo9_ic_pos = jo9_ic_next + len($jo9_ic_tag)',
  '  else',
  '   jo9_ic_pos = jo9_ic_next + 4',
  '  end',
  "  jump 'jo9_condition_html_scan'",
  ' end',
  ' $result = $jo9_ic_html',
  ' exit',
  'end',
  "if $args[0] = 'jo9_condition_path':",
  ' $result = $args[1]',
  ' exit',
  'end',
  "if $args[0] = 'jo9_cut_condition':",
  ' result = -1',
  ' exit',
  'end',
  '! JO9 MOD END '+marker,
  ''
 ];
 const generated=lines.join(eol),start='! JO9 MOD START '+marker,end='! JO9 MOD END '+marker;
 const starts=body.split(start).length-1,ends=body.split(end).length-1;
 const newReturn="$result = func('interior_change', 'jo9_condition_html', $jo9_html)";
 if(starts||ends){
  if(starts!==1||ends!==1||!body.includes(generated)||body.split(newReturn).length-1!==1)throw Error('등장 조건 기본 출력 코드의 주석 경계 또는 내용이 다릅니다.');
  return body;
 }
 const anchor=/^if \$args\[0\] = 'jo9_html':\r?$/gm,matches=[...body.matchAll(anchor)];
 if(matches.length!==1)throw Error('기본 이미지 HTML 변환 위치를 찾지 못했습니다.');
 let next=body.slice(0,matches[0].index)+generated+body.slice(matches[0].index);
 const excluded=/(^[ \t]*if \$curloc = 'main_screen'[^\r\n]*instr\(\$jo9_html, 'fight_bg'\)[^\r\n]*:\r?\n)([ \t]*)\$result = \$jo9_html(?=\r?\n[ \t]*exit)/gm;
 const found=[...next.matchAll(excluded)];
 if(found.length!==1)throw Error('집·전투의 이미지 전환 제외 분기를 찾지 못했습니다.');
 next=next.replace(excluded,(_,head,spaces)=>head+spaces+newReturn);
 return next;
}
function buildBody(body,input){
 const normalized=normalizeRules(input),old=inspectBlocks(body);
 let next=removeBlocks(body,old.ranges);
 if(!normalized.length)return next;
 const eol=next.includes('\r\n')?'\r\n':'\n';
 const block=(name,lines)=>['! JO9 MOD START '+id(name),...lines,'! JO9 MOD END '+id(name),''].join(eol);
 function insertBefore(re,text,what){
  const matches=[...next.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
  if(matches.length!==1)throw Error('이미지 전환 '+what+' 연결 지점을 정확히 찾지 못했습니다.');
  const at=matches[0].index;next=next.slice(0,at)+text+next.slice(at);
 }
 function insertAfter(re,text,what){
  const matches=[...next.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
  if(matches.length!==1)throw Error('이미지 전환 '+what+' 연결 지점을 정확히 찾지 못했습니다.');
  let at=matches[0].index+matches[0][0].length;
  if(next[at]==='\n')at++;
  next=next.slice(0,at)+text+next.slice(at);
 }
 const registry=next.match(/^[ \t]*! JO9 WINDOWS IMAGE SLOT REGISTRY START[^\r\n]*(?:\r?\n)[\s\S]*?^[ \t]*! JO9 WINDOWS IMAGE SLOT REGISTRY END[^\r\n]*/m);
 if(!registry)throw Error('Windows 이미지 전환 등록 구간을 찾을 수 없습니다.');
 const groups=[...registry[0].matchAll(/^if \$jo9_base = '((?:[^']|'')*)':\r?\n([\s\S]*?)^end\r?$/gm)];
 for(const rule of normalized){
  const group=groups.find(x=>x[1].replaceAll("''","'").toLowerCase()===rule.base);
  if(!group)continue;
  const paths=new Map([...group[2].matchAll(/^[ \t]*\$jo9_candidates\[(\d+)\] = '((?:[^']|'')*)'\r?$/gm)].map(m=>[m[1],m[2].replaceAll("''","'").toLowerCase()]));
  if([...paths.values()].includes(rule.path))continue;
  const desired=10000+cutNumber(rule.path);
  if([...group[2].matchAll(/^[ \t]*jo9_candidate_ids\[(\d+)\] = (\d+)\r?$/gm)].some(m=>Number(m[2])===desired))throw Error('추가 컷의 저장 선택 ID가 기존 등록과 충돌합니다.');
 }
 const data=[JSON_MARK+JSON.stringify(normalized),"if $args[0] = 'jo9_cut_condition':",' result = -1'];
 for(const rule of normalized){
  data.push(" if $lcase($replace($args[1], '\\', '/')) = "+quote(rule.base)+" and $lcase($replace($args[2], '\\', '/')) = "+quote(rule.path)+':','  result = 0','  if '+conditionExpression(rule)+': result = '+cutNumber(rule.path),'  exit',' end');
 }
 data.push(' exit','end');
 data.push("if $args[0] = 'jo9_condition_path':",' local $jo9_ic_path_input, $jo9_ic_path_base, jo9_ic_path_best, jo9_ic_path_match, jo9_ic_path_exists',' $jo9_ic_path_input = $args[1]'," $jo9_ic_path_base = $lcase($replace($jo9_ic_path_input, '\\', '/'))",' $result = $jo9_ic_path_input',' jo9_ic_path_best = 0');
 for(const rule of normalized){
  data.push(' if $jo9_ic_path_base = '+quote(rule.base)+':',"  jo9_ic_path_match = func('interior_change', 'jo9_cut_condition', $jo9_ic_path_base, "+quote(rule.path)+')','  if jo9_ic_path_match >= 2 and (jo9_ic_path_best = 0 or jo9_ic_path_match < jo9_ic_path_best):','   jo9_ic_path_exists = 0',"   dynamic 'jo9_ic_path_exists = %"+rule.path+"%'",'   if jo9_ic_path_exists = 1:','    $result = '+quote(rule.path),'    jo9_ic_path_best = jo9_ic_path_match','   end','  end',' end');
 }
 data.push(' exit','end');
 insertBefore(/^if \$args\[0\] = 'jo9_path':\r?$/m,block('DATA',data),'경로 함수');
 const locals=[' local jo9_ic_rule, jo9_ic_auto_at, jo9_ic_auto_cut, jo9_ic_duplicate, jo9_ic_scan',' jo9_ic_auto_at = -1',' jo9_ic_auto_cut = 0',' jo9_ic_rule = -1'];
 insertBefore(/^[ \t]*jo9_active_count = 0\r?$/m,block('LOCALS',locals),'후보 초기화');
 const extra=[];
 normalized.forEach((rule,i)=>{
  const label='jo9_cut_condition_supplement_'+(i+1);
  extra.push(' if $jo9_base = '+quote(rule.base)+':','  jo9_ic_duplicate = 0','  jo9_ic_scan = 0','  :'+label,'  if jo9_ic_scan < jo9_count:',"   if $lcase($replace($jo9_candidates[jo9_ic_scan], '\\', '/')) = "+quote(rule.path)+': jo9_ic_duplicate = 1','   jo9_ic_scan += 1',"   jump '"+label+"'",'  end','  if jo9_ic_duplicate = 0:','   $jo9_candidates[jo9_count] = '+quote(rule.path),'   jo9_candidate_ids[jo9_count] = '+(10000+cutNumber(rule.path)),'   jo9_count += 1','  end',' end');
 });
 insertBefore(/^[ \t]*jo9_active_count = 0\r?$/m,block('SUPPLEMENT',extra),'조건 컷 후보 보완');
 const filter=[' jo9_ic_rule = -1',' if jo9_exists = 1:',"  jo9_ic_rule = func('interior_change', 'jo9_cut_condition', $jo9_base, $jo9_candidate)",'  if jo9_ic_rule = 0: jo9_exists = 0',' end'];
 const tracked=[' if jo9_ic_rule >= 2 and (jo9_ic_auto_at < 0 or jo9_ic_rule < jo9_ic_auto_cut):','  jo9_ic_auto_at = jo9_active_count','  jo9_ic_auto_cut = jo9_ic_rule',' end'];
 // The different ID assignment lines identify both existing append paths.
 const appendMatches=[...next.matchAll(/^[ \t]*if jo9_exists = 1:\r?\n[ \t]*\$jo9_active_paths\[jo9_active_count\] = \$jo9_candidate\r?\n[ \t]*jo9_active_ids\[jo9_active_count\] = (jo9_candidate_ids\[jo9_i\]|10000 \+ jo9_slot)\r?$/gm)];
 if(appendMatches.length!==2||new Set(appendMatches.map(m=>m[1])).size!==2)throw Error('등록·동적 후보의 두 이미지 전환 연결 지점을 찾지 못했습니다.');
 for(const kind of ['REGISTERED','WINDOWS']){
  const expression=kind==='REGISTERED'?'jo9_candidate_ids\\[jo9_i\\]':'10000 \\+ jo9_slot';
  insertBefore(new RegExp('^[ \\t]*if jo9_exists = 1:\\r?\\n[ \\t]*\\$jo9_active_paths\\[jo9_active_count\\] = \\$jo9_candidate\\r?\\n[ \\t]*jo9_active_ids\\[jo9_active_count\\] = '+expression+'\\r?$','m'),block(kind+'_FILTER',filter),kind+' 조건 판정');
  insertAfter(new RegExp('^[ \\t]*jo9_active_ids\\[jo9_active_count\\] = '+expression+'\\r?$','m'),block(kind+'_AUTO',tracked),kind+' 조건 컷 우선순위');
 }
 insertBefore(/^[ \t]*if jo9_selected_at < 0:\r?$/m,block('SELECT',[' if args[2] = 0 and jo9_ic_auto_at >= 0: jo9_selected_at = jo9_ic_auto_at']),'자동 선택');
 // Ensure our metadata and all removable hooks round-trip before returning.
 const checked=inspectBlocks(next);
 if(JSON.stringify(checked.rules)!==JSON.stringify(normalized)||removeBlocks(next,checked.ranges)!==removeBlocks(body,old.ranges))throw Error('등장 조건 외의 QSP 본문이 변경되었습니다.');
 return next;
}
module.exports={normalizeCondition,conditionExpression,OPTIONS,normalizeRules,readRules,installBaseBody,buildBody};
