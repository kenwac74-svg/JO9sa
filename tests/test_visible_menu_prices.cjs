// 비용 표시와 무료 예외를 검사한다. 선택적 BASE_QSP로 실행 코드 보존도 확인한다.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const repo=process.argv[4]||path.resolve(__dirname,'..');
const core=require(path.join(repo,'tools/text-workshop/core.cjs'));
function load(file){const raw=fs.readFileSync(file),d=core.parse(raw);assert(core.serialize(d).equals(raw));return Object.fromEntries(d.locations.map(l=>[l.name,core.shift(d.lines[l.body],5)]));}
const b=load(process.argv[2]);let checks=0;
function check(x,msg){assert(x,msg);checks++;}
for(const title of ['해변 (2$)','극장 (4$)','식당 (8$)','온천 (2$)','"황금 새장" (5$)','해변 데이트 (4$)','둘 다 데이트 (12$)','공연 관람 (0$)'])check(b.menu_form.includes(title),title);
for(const [loc,body] of Object.entries(b))for(const line of body.split('\n'))if(/func\s*\(\s*['"]\$menu/i.test(line)&&!line.trimStart().startsWith('!'))check(!/(?:\d|>>)(?:<\/b>)?\s*스파크/.test(line),'Korean amount unit: '+loc);
for(const who of ['노예상','노예','조수'])for(const cost of [0,5])check(b['#options'].includes(`검진 : ${who} (${cost}$)`),'Free/paid examination');
for(const [title,cost] of [['신선한 우유 x5',30],['농축된 크림 x5',30],['숙성 치즈/버터 x5',30],['신선한 야채류 x5',10],['시리얼/곡물류 x5',10],['허브류/향신료 x5',10]]){
 const matches=[...b['#options'].matchAll(new RegExp(title+' \\((\\d+)\\$\\)','g'))];check(matches.length>=2&&matches.every(m=>+m[1]===cost),'Active/disabled '+title);
}
check(b['#options'].includes('파티에 간다 (100~300$)'),'Random fee range');
check(b['#options'].includes('고기용 도축하기 (5$)'),'Visible processing fee');
check(b.interaction.includes('interaction_reward_cost = iif(custom_game = 0 and hero_choice = 6, 0, 4)'),'Maestro exception');
function splitArgs(s,start){let a=[],begin=start,depth=0,q=null;for(let i=start;i<s.length;i++){const c=s[i];if(q){if(c===q){if(s[i+1]===q){i++;continue;}q=null;}}else if(c==="'"||c==='"')q=c;else if('([{'.includes(c))depth++;else if(')]}'.includes(c)){if(depth===0)return {args:a.concat(s.slice(begin,i).trim()),end:i};depth--;}else if(c===','&&depth===0){a.push(s.slice(begin,i).trim());begin=i+1;}}throw Error('Unterminated call');}
if(process.argv[3]){
 const before=load(process.argv[3]);check(JSON.stringify(Object.keys(b))===JSON.stringify(Object.keys(before)),'Locations');
 for(const loc of Object.keys(before)){
  const aa=before[loc].split('\n'),zz=b[loc].split('\n');check(aa.length===zz.length,'Line structure '+loc);
  for(let i=0;i<aa.length;i++){
   const old=aa[i],now=zz[i];if(old===now)continue;
   const re=/\bfunc\s*\(\s*['"]\$menu['"]\s*,/ig,ms=[...old.matchAll(re)];
   if(ms.length){
    check(ms.length===1,'Review multiple changed calls');const m=ms[0],oldArgs=splitArgs(old,m.index+m[0].length),newArgs=splitArgs(now,m.index+m[0].length);
    check(old.slice(0,m.index+m[0].length)===now.slice(0,m.index+m[0].length),'Menu guard changed');
    check(old.slice(oldArgs.end)===now.slice(newArgs.end),'Menu suffix changed');
    const kind=oldArgs.args[0].slice(1,-1).toLowerCase(),ti=['goto','goto_city','goto_2','gotobarn'].includes(kind)?5:3;
    check(oldArgs.args.length===newArgs.args.length,'Argument count');
    check(oldArgs.args.slice(0,ti).join('\0')===newArgs.args.slice(0,ti).join('\0'),'Action/target changed');
   }else{
    check(/^\s*\$(?:text\[1\]|text_display|sp_text\[\d+\]|price|item_cost)\s*\+?=/.test(old),'Unexpected non-display edit: '+loc+':'+(i+1));
    check(old.split('=')[0]===now.split('=')[0],'Display assignment target changed');
   }
  }
 }
 for(const n of ['interaction','interaction_result','interaction_result_city','next_day','$newloc','$ongload','refresh_database'])check(before[n]===b[n],'Execution path changed: '+n);
}
console.log(`PASS ${checks} checks: visible prices, free exceptions, ranges and unchanged menu actions. Source verification only; user gameplay pending.`);
