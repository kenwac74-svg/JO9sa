'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{test}=require('node:test');
const repo=fs.existsSync(path.join(__dirname,'../tools/text-workshop/core.cjs'))?path.resolve(__dirname,'..'):'G:/somi/JO9sa';
const c=require(path.join(repo,'tools/text-workshop/core.cjs'));
const raw=fs.readFileSync(process.argv[2]),doc=c.parse(raw);
const get=(d,n)=>{const l=d.locations.find(l=>l.name===n);assert(l,n);return c.shift(d.lines[l.body],5);};
const body=n=>get(doc,n),market=body('slave_auction_sell'),auction=body('$guild_auction'),city=body('interaction_city');
const ready=market.includes('JO9_MEIKI_MARKET_V1')&&auction.includes('JO9_MEIKI_AUCTION_V1');
const region=(s,a,b)=>{const start=s.indexOf(a);assert(start>=0,a);const end=s.indexOf(b,start+a.length);assert(end>=0,b);return s.slice(start,end);};
const div=(a,b)=>Math.trunc(a/b);
// Small offline evaluator for the scalar/array expressions in these changed paths.
// It is not a replacement for QSP engine or user play testing.
function expr(text,ctx){
 const ts=text.match(/'(?:''|[^'])*'|"(?:""|[^"])*"|\$?[A-Za-z_][A-Za-z_0-9]*|\d+|>=|<=|[+*/(),\[\]<>!=\-]/g)||[];let at=0;
 const prec={or:1,and:2,'=':3,'!':3,'>':3,'<':3,'>=':3,'<=':3,'+':4,'-':4,'*':5,'/':5,mod:5};
 const primary=()=>{const t=ts[at++];assert(t,'Expression '+text);if(t==='('){const v=parse(0);assert.equal(ts[at++],')');return v;}if(t==='-')return -primary();if(/^\d+$/.test(t))return +t;if(t[0]==="'"||t[0]==='"')return t.slice(1,-1).replaceAll(t[0]+t[0],t[0]).replace(/<<(.+?)>>/g,(_,e)=>String(expr(e,ctx)));if(ts[at]==='('){at++;const a=[];while(ts[at]!==')'){a.push(parse(0));if(ts[at]!==',')break;at++;}assert.equal(ts[at++],')');assert(['min','max'].includes(t));return Math[t](...a);}let v=ctx[t]??0;while(ts[at]==='['){at++;const k=parse(0);assert.equal(ts[at++],']');v=v[k]??0;}return v;};
 const parse=min=>{let a=primary();while(at<ts.length&&(prec[ts[at]]??-1)>=min){const op=ts[at++],b=parse(prec[op]+1);a=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?div(a,b):op==='mod'?a%b:op==='='?+(a===b):op==='!'?+(a!==b):op==='>'?+(a>b):op==='<'?+(a<b):op==='>='?+(a>=b):op==='<='?+(a<=b):op==='and'?+(!!a&&!!b):+(!!a||!!b);}return a;};
 const v=parse(0);assert.equal(at,ts.length,text);return v;
}
function run(source,input){
 source=source.replace(/_\r?\n\s*/g,'');
 const ctx=structuredClone(input),root=[],stack=[root];
 for(let line of source.split(/\r?\n/)){line=line.trim();if(!line||line[0]==='!')continue;line=line.split(' &!')[0].trim();
  const push=s=>stack.at(-1).push({kind:'line',text:s});
  if(line.startsWith('if ')){const at=line.indexOf(':'),n={kind:'if',branches:[{when:line.slice(3,at),body:[]}]};assert(at>0,line);stack.at(-1).push(n);if(line.slice(at+1).trim())n.branches[0].body.push({kind:'line',text:line.slice(at+1).trim()});else stack.push(n,n.branches[0].body);}
  else if(line==='else'){stack.pop();const n=stack.at(-1);n.branches.push({when:'1',body:[]});stack.push(n.branches.at(-1).body);}
  else if(line==='end'){stack.pop();stack.pop();}
  else push(line);
 }
 assert.equal(stack.length,1,'Balanced blocks');
 const walk=nodes=>{for(const n of nodes){if(n.kind==='if'){const b=n.branches.find(x=>expr(x.when,ctx));if(b)walk(b.body);continue;}const line=n.text;if(line[0]===':')continue;if(line.startsWith('jump '))throw {jump:expr(line.slice(5),ctx)};
  const m=line.match(/^(?:local )?(\$?\w+)(?:\[(.+?)\])?\s*(\+=|-=|\*=|=)\s*(.+)$/);assert(m,line);const value=expr(m[4],ctx),key=m[2]===undefined?undefined:expr(m[2],ctx);let old;if(key===undefined)old=ctx[m[1]]??0;else{ctx[m[1]]??={};old=ctx[m[1]][key]??0;}const v=m[3]==='='?value:m[3]==='+='?old+value:m[3]==='-='?old-value:old*value;if(key===undefined)ctx[m[1]]=v;else ctx[m[1]][key]=v;
 }};
 let at=0,steps=0;while(at<root.length){assert(++steps<20000,'Loop terminates');try{walk([root[at++]]);}catch(e){if(!e.jump)throw e;const target=root.findIndex(n=>n.kind==='line'&&n.text===':'+e.jump);assert(target>=0,e.jump);at=target+1;}}
 return ctx;
}
test('명기 시장 선택지·후속 대사와 경매 최종 입찰이 연결된다',()=>{assert(ready,'Missing market/auction premium paths');assert(city.includes('JO9_MEIKI_BARGAIN_TEXT_V1'));});
test('시장 10배는 추가 선택 이후 페이지에서만, 재방문해도 100배가 되지 않는다',{skip:!ready},()=>{
 const pricing=region(market,'sell_price = slaveprice/2',"$npc_id = 'фарид_аукционщик'");
 for(const state of [0,1,2,3,4])for(const price of [0,19,30,825,1500,2500])for(const page of [1,4,5,6,7]){
  const input={slave:{virginity:state},slaveprice:price,txt:page,sell_price:123456};const a=run(pricing,input),expected=Math.max(10,div(price,2))*(state===4&&[6,7].includes(page)?10:1);assert.equal(a.sell_price,expected);assert.equal(run(pricing,a).sell_price,expected);
 }
 const offer=region(market,'! JO9_MEIKI_MARKET_V1','! JO9_MEIKI_MARKET_END');
 const a=run(offer,{slave:{virginity:4},$text:{5:'old'},sell_price:4120,$master_name:'잭'});assert(a.$text[5].includes('txt = 6'));assert(a.$text[5].includes('희귀한 명기'));assert(a.$text[6].includes('4120'));assert(a.$text[7].includes('slave_auction_sell_end'));assert(!a.$text[7].includes('txt = 6'));
 for(const state of [0,1,2,3]){const b=run(offer,{slave:{virginity:state},$text:{5:'old'}});assert.equal(b.$text[5],'old');assert.equal(b.$text[6],undefined);}
 assert(market.includes('if txt ! 5 and txt ! 7: addobj'));assert(market.includes('if txt > 1: addobj'));
 const end=body('slave_auction_sell_end');assert.equal((end.match(/sparks \+= sell_price/g)||[]).length,1);assert(!end.includes('* 10')); // one payment only
});
test('시장 기존 부채·브랜드 거절을 우회하는 선택지가 생기지 않는다',{skip:!ready},()=>{
 assert(market.indexOf('if farid_potential_debt > 0:')<market.indexOf('JO9_MEIKI_MARKET_V1'));
 assert(market.indexOf('if farid_debt > 0:')<market.indexOf('JO9_MEIKI_MARKET_V1'));
 assert(market.indexOf('JO9_MEIKI_MARKET_V1')>market.indexOf("elseif brand_reputation > 3:"));
 assert(market.includes("if slave['brand'] > 0 and brand_reputation <= 3:"));
});
test('길드의 기존 입찰 결과가 누구이든 마지막 2배 입찰과 지급액이 일치한다',{skip:!ready},()=>{
 const premium=region(auction,'! JO9_MEIKI_AUCTION_V1','sparks_get = bank_size');
 for(const state of [0,1,2,3,4])for(const price of [15,500,3500,8000,25000])for(const winner of ['비숍 아바톤','아크바르 대령','레이디 야스메니아','Middleman']){
  const x=run(premium,{slave:{virginity:state},bank_size:price,$auc_winner:winner,u:12,$auction_flow:{11:'old hammer',10:'old second'}});
  assert.equal(x.bank_size,price*(state===4?2:1));if(state===4){assert.equal(x.$auc_winner,'가면 쓴 수집가');assert(x.$auction_flow[11].includes(String(price*2)));assert(x.$auction_flow[12].includes(String(price*2)));assert(x.$auction_flow[12].includes('가면 쓴 수집가'));}else{assert.equal(x.$auc_winner,winner);assert.equal(x.$auction_flow[11],'old hammer');}
 }
 assert(auction.indexOf('! JO9_MEIKI_AUCTION_V1')>auction.lastIndexOf("jump 'torg_loop'"));
 assert.equal((auction.match(/bank_size \*= 2/g)||[]).length,1);
 assert(auction.includes("sparks_get = bank_size\r\ninteraction_city = 931"));assert(city.includes('sparks += sparks_get'));
});
test('원래 입찰기는 아바톤 승리를 강제하지 않고 동일 입력에서 반복된다',{skip:!ready},()=>{
 const original=region(auction,'bank_size = max(15, auction_increment[rating])','! JO9_MEIKI_AUCTION_V1');
 const base={day:13,rating:6,charm:20,slave:{prestige:0},auction_increment:{6:100},auction_random:{4:50},$auction_participant:{1:'akbar',2:'abbaton'},$npc_name:{akbar:'아크바르 대령',abbaton:'비숍 아바톤'},demand_rating:{akbar:4,abbaton:4},n:2,$slave_name:'테스트'};
 const a=run(original,{...base,cap_summ:{akbar:2500,abbaton:0}}),b=run(original,{...base,cap_summ:{akbar:0,abbaton:2500}});assert.equal(a.$auc_winner,'아크바르 대령');assert.equal(b.$auc_winner,'비숍 아바톤');assert.deepEqual(run(original,{...base,cap_summ:{akbar:2500,abbaton:0}}),a);
});
test('명기 흥정 문구 분기는 금액·예산·기존 거래 결과를 바꾸지 않는다',{skip:!ready},()=>{
 const code=region(city,'! JO9_MEIKI_BARGAIN_TEXT_V1','! JO9_MEIKI_BARGAIN_TEXT_END');
 for(const active of [0,1]){const x=run(code,{jo9_meiki_max_sale:active,$text:{1:'old'},sell_price:1066,$slave_name:'이사벨라'});assert.equal(x.sell_price,1066);assert.equal(x.$text[1].includes('명기'),!!active);}
});
test('QSP 문자열과 코드 경계가 닫히고 선언한 변경만 역적용하면 전체 바이트가 복원된다',{skip:!ready},()=>{
 const scan=require(path.join(repo,'tools/qa/qsp-preformat.cjs'));for(const s of [market,auction,city]){const x=scan(s);assert.equal(x.quote,'');assert.equal(x.depth,0);}
 assert(c.serialize(doc).equals(raw));
 if(process.argv[3]&&process.argv[4]){const mod=JSON.parse(fs.readFileSync(process.argv[4],'utf8')),restored=c.parse(raw);for(const e of [...mod.edits].reverse()){const l=restored.locations.find(l=>l.name===e.location);let s=c.shift(restored.lines[l.body],5);assert.equal(s.split(e.new).length-1,e.count,e.location);restored.lines[l.body]=c.shift(s.replace(e.new,e.old),-5);}assert(c.serialize(restored).equals(fs.readFileSync(process.argv[3])));}
});
