'use strict';
// Static source metadata only. Never evaluates QSP or alters saves/images.
const normalize=s=>String(s).replace(/\\/g,'/').replace(/^\.\.\//,'').replace(/^\//,'').toLowerCase();
const rx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const text=s=>String(s).replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
function splitArgs(s){const out=[];let q='',depth=0,start=0;for(let i=0;i<s.length;i++){const ch=s[i];if(q){if(ch===q){if(s[i+1]===q)i++;else q='';}}else if(ch==='\''||ch==='"')q=ch;else if(ch==='('||ch==='[')depth++;else if(ch===')'||ch===']')depth--;else if(ch===','&&depth===0){out.push(s.slice(start,i).trim());start=i+1;}}out.push(s.slice(start).trim());return out;}
const literal=s=>/^(['"])([\s\S]*)\1$/.test(s)?s.slice(1,-1).replaceAll(s[0]+s[0],s[0]):null;
function build({doc,core,scenes,files,menuIds={},external=[]}){
 const entries={},byNorm=new Map();for(const path of files){const key=normalize(path);entries[key]={path,status:'unlinked',summary:'현재 WORK 소스에서 실행 연결을 확인하지 못했습니다.',references:[],alternates:[]};byNorm.set(key,entries[key]);}
 const menus=new Map(),locations=[],aliases=[],unresolved=[],incoming=new Map();
 const menuKey=s=>literal(s)??(Object.hasOwn(menuIds,s)?String(menuIds[s]):s);
 // Only parse menu source locations; string declarations contain deferred menu code.
 for(const loc of doc.locations){const body=core.shift(doc.lines[loc.body],5);if(!/scene[\\/]|\$menu|public_use/i.test(body))continue;const literals=core.literals(body);const analysis=scenes.analyse(loc.name,body),rows=body.split('\n'),lineStarts=analysis.lineStarts;const data={loc,body,literals,analysis,rows,lineStarts};locations.push(data);
  for(const [rowIndex,row]of rows.entries()){
   const safe=scenes.masked(row);for(const match of safe.matchAll(/\bfunc\s*\(/gi)){let at=match.index+match[0].length,depth=1,q='',end=at;for(;end<row.length;end++){const ch=row[end];if(q){if(ch===q){if(row[end+1]===q)end++;else q='';}}else if(ch==='\''||ch==='"')q=ch;else if(ch==='(')depth++;else if(ch===')'&&--depth===0)break;}
    const args=splitArgs(row.slice(at,end));if(literal(args[0]||'')!=='$menu')continue;const kind=literal(args[1]||'');let id,target,label;if(['interaction','interaction_city','sex_interaction','trading','sp_txt'].includes(kind)){target=kind;id=menuKey(args[3]||'');label=literal(args[4]||'');}else if(kind==='goto'){id=menuKey(args[3]||'');target=literal(args[5]||'');label=literal(args[6]||'');}else if(kind==='exec_options'){const code=literal(args[3]||''),m=code?.match(/\b(interaction_city|interaction|sex_interaction)\s*=\s*(\d+)/i);if(m){target=m[1];id=m[2];label=literal(args[4]||'');}}
    if(!target||!id||!label)continue;const key=target.toLowerCase()+':'+id;if(!menus.has(key))menus.set(key,[]);const offset=lineStarts[rowIndex]+match.index;menus.get(key).push({label:text(label),location:loc.name,line:rowIndex+1,conditions:analysis.blocks.filter(b=>b.kind==='if'&&offset>=b.start&&offset<b.end).map(b=>b.condition)});
   }
  }
 }
 const add=(entry,ref)=>{const key=JSON.stringify([ref.location,ref.line,ref.pathExpression,ref.kind,ref.parentPath]);if(!entry.references.some(x=>x.key===key))entry.references.push({...ref,key});};
 const exactPaths=(s)=>{const key=normalize(s),keys=/\.(?:png|gif|jpe?g|webp)$/i.test(key)?[key]:['.png','.gif','.jpg','.jpeg','.webp'].map(ext=>key+ext);return keys.flatMap(k=>byNorm.has(k)?[byNorm.get(k)]:[]);};
 for(const loc of doc.locations){if(loc.name.startsWith('#'))continue;const body=core.shift(doc.lines[loc.body],5);if(!/\b(?:interaction_city|interaction|sex_interaction|city_form)\s*=/.test(body))continue;const analysis=scenes.analyse(loc.name,body);for(const m of analysis.safe.matchAll(/(?:^|[&:\n])\s*(interaction_city|interaction|sex_interaction|city_form)\s*=\s*(\d+|[a-z_][\w]*)\b/gmi)){const key=m[1].toLowerCase()+':'+menuKey(m[2]),conditions=analysis.blocks.filter(b=>b.kind==='if'&&m.index>=b.start&&m.index<b.end).map(b=>b.condition);if(conditions.some(s=>s.replace(/\s/g,'').toLowerCase()===m[1].toLowerCase()+'='+m[2].toLowerCase()))continue;if(!incoming.has(key))incoming.set(key,[]);incoming.get(key).push({location:loc.name,line:body.slice(0,m.index).split('\n').length,conditions});}}
 for(const d of locations){const {loc,body,literals,analysis,rows}=d;
  if(loc.name==='interior_change'){
   let base='';for(const row of rows){const m=row.match(/^if \$jo9_base = '([^']+)':/);if(m)base=m[1];const a=row.match(/^ \$jo9_candidates\[\d+\] = '([^']+)'/);if(base&&a&&normalize(base)!==normalize(a[1])&&normalize(base).startsWith('content/pic/scene/'))aliases.push({base,path:a[1]});if(/^end\s*$/.test(row))base='';}continue;
  }
  for(const item of literals){const candidates=[];if(/^(?:content[\\/]pic[\\/])?scene[\\/]/i.test(item.text))candidates.push(item.text);else if(/<(?:img|div)\b/i.test(item.text)){for(const m of item.text.matchAll(/(?:src\s*=\s*['"]|url\(['"]?)([^'"<>]+\.(?:png|gif|jpe?g|webp))/gi))if(/^(?:content[\\/]pic[\\/])?scene[\\/]/i.test(m[1]))candidates.push(m[1]);}
   if(!candidates.length)continue;
   const offset=item.start-1,lineStart=analysis.lineStarts[item.line-1]||0,prefix=body.slice(lineStart,offset),row=rows[item.line-1]||'',enclosing=analysis.blocks.filter(b=>b.kind==='if'&&offset>=b.start&&offset<b.end),conditions=enclosing.map(b=>b.condition),event=enclosing.findLast(b=>b.predicate&&['interaction_city','interaction','sex_interaction','end_day_screen','city_form','sp_txt'].includes(b.predicate.key)),scope=event||enclosing.find(b=>b.parents.length===0),scopeText=scope?body.slice(scope.start,scope.end):'',places=[...new Set([...scopeText.matchAll(/\$place\s*=\s*(['"])([^'"\r\n]+)\1/g)].map(m=>m[2]))];
   const target=event?.predicate,route=target?(menus.get(target.key+':'+target.value)||[]):[];
   const lhs=prefix.match(/(\$[\wа-яА-Я]+(?:\[[^\]\r\n]+\])?)\s*\+?=\s*$/u)?.[1]||'';
   const definition=/^#/.test(loc.name)||/\$item_demo|\$ib_cycle/.test(row)||(!lhs&&!/^\s*\*p(?:l)?\b/i.test(prefix));
   const slot=lhs.match(/\$special_image(?:_full)?\[(\d+)\]/i)?.[1];
   const sliceStart=Math.max(scope?.start||0,analysis.lineStarts[Math.max(0,item.line-4)]||0),sliceEnd=Math.min(scope?.end||body.length,analysis.lineStarts[Math.min(rows.length-1,item.line+9)]||body.length);let look=body.slice(sliceStart,sliceEnd);const lookChars=look.split('');for(const comment of core.literals(look,true).filter(x=>x.comment))for(let i=comment.start-1;i<=comment.end;i++)lookChars[i]=' ';look=lookChars.join('');let numbered=false;
   if(lhs&&/picmax\s*\[/i.test(look)&&new RegExp(rx(lhs)+'\\s*\\+=\\s*[\'"]_[\'"]').test(look)&&/\brand\s*\(/i.test(look))numbered=true;
   const refBase={location:loc.name,line:item.line,conditions,placeCandidates:places.slice(0,8),entry:target?{variable:target.key,value:target.value}:null,menus:route,upstream:target?(incoming.get(target.key+':'+target.value)||[]):[],slot:slot?+slot:null,lhs,kind:definition?'definition':'direct',selection:'fixed',note:definition?'등록/정의부입니다. 실제 소비 경로는 별도 확인이 필요합니다.':''};
   if(/\$ib_cycle/.test(row)){const parts=core.literals(row);refBase.itemId=parts[0]?.text;refBase.itemName=parts[1]?.text;refBase.arrayName='$item_demo';}
   const demo=lhs.match(/\$item_demo\[(['"])([^'"]+)\1\]/);if(demo){refBase.itemId=demo[2];refBase.arrayName='$item_demo';}
   for(let expression of candidates){expression=expression.replace(/^content[\\/]pic[\\/]/i,'');if(!/\.(?:png|gif|jpe?g|webp)$/i.test(expression)&&!expression.includes('<<'))expression=expression.replace(/[\r\n].*$/s,'');const normalized='content/pic/'+normalize(expression),ref={...refBase,pathExpression:expression};
    let found=exactPaths(normalized);
    if(expression.includes('<<')){
     let re='^',last=0,known=true;for(const m of normalize(expression).matchAll(/<<([\s\S]*?)>>/g)){re+=rx(normalize(expression).slice(last,m.index));const random=m[1].match(/^rand\(\s*(\d+)\s*,\s*(\d+)\s*\)$/);if(random&&+random[2]-+random[1]<=1000){re+='(?:'+Array.from({length:+random[2]-+random[1]+1},(_,i)=>i+(+random[1])).join('|')+')';}else{re+='[^/]*';known=false;}last=m.index+m[0].length;}re+=rx(normalize(expression).slice(last));if(!/\.(?:png|gif|jpe?g|webp)$/i.test(expression))re+='\\.(?:png|gif|jpe?g|webp)';re+='$';const matcher=new RegExp(re,'i');found=files.filter(p=>matcher.test(normalize(p).replace(/^content\/pic\//,''))).map(p=>byNorm.get(normalize(p)));ref.selection=known?'random':'dynamic';if(!known)ref.note='동적 파일명 패턴과 일치하는 후보입니다. 변수값과 실제 호출은 추가 확인이 필요합니다.';
    }else if(numbered&&new RegExp('picmax\\s*\\[\\s*[\'"]'+rx(normalized.split('/').at(-1).replace(/\.(?:png|gif|jpe?g|webp)$/i,''))+'[\'"]','i').test(look)){const stem=normalized.replace(/\.(?:png|gif|jpe?g|webp)$/i,''),matcher=new RegExp('^'+rx(stem)+'(?:_[2-9][0-9]*|_1[0-9]+)?\\.(?:png|gif|jpe?g|webp)$','i');found=files.filter(p=>matcher.test(normalize(p))).map(p=>byNorm.get(normalize(p)));ref.selection='random';ref.note='picMax와 난수로 번호를 붙이는 코드에 연결된 후보입니다.';}
    if(!found.length)unresolved.push({location:loc.name,line:item.line,expression,kind:ref.kind,selection:ref.selection});
    for(const entry of found)add(entry,ref);
   }
  }
 }
 // Resolve the verified item-demo name table to its actual image consumer.
 const itemConsumers=[];for(const loc of doc.locations){if(loc.name.startsWith('#'))continue;const body=core.shift(doc.lines[loc.body],5);if(!/\$item_demo\[\$item_id\]/i.test(body))continue;const analysis=scenes.analyse(loc.name,body);for(const m of body.matchAll(/\$(?:bg_path|special_bg|service_picture)\s*=\s*\$item_demo\[\$item_id\]/gi)){if(!scenes.masked(body.slice(m.index,m.index+m[0].length)).trim())continue;const line=body.slice(0,m.index).split('\n').length;const conditions=analysis.blocks.filter(b=>b.kind==='if'&&m.index>=b.start&&m.index<b.end).map(b=>b.condition);itemConsumers.push({location:loc.name,line,conditions});}}
 for(const e of Object.values(entries))for(const def of [...e.references])if(def.arrayName==='$item_demo'&&def.itemId)for(const use of itemConsumers)add(e,{...def,location:use.location,line:use.line,kind:'direct',conditions:[...use.conditions,"$item_id = '"+def.itemId+"'"],definedAt:{location:def.location,line:def.line},note:'아이템 설명 화면이 이 이미지명표를 읽습니다. 실제 소지/구매 조건은 해당 메뉴에서 결정됩니다.'});
 for(const e of external){const match=exactPaths(e.path);for(const entry of match)add(entry,{location:e.source,line:e.line||1,pathExpression:e.path,kind:'definition',selection:'fixed',conditions:[],placeCandidates:[],menus:[],note:e.note||'외부 정의부에서 참조합니다. 실제 소비 경로는 추가 확인이 필요합니다.'});}
 for(const alias of aliases){const entry=byNorm.get(normalize(alias.path)),parent=byNorm.get(normalize(alias.base));if(!entry)continue;entry.alternates.push(alias.base);for(const p of parent?.references||[])add(entry,{...p,kind:'alternate',parentPath:alias.base,note:'이 기본 이미지가 표시될 때 좌상단 이미지 전환으로 선택하는 추가 컷입니다.'});}
 for(const e of Object.values(entries)){
  const live=e.references.filter(r=>r.kind==='direct');
  if(live.length){e.status=live.some(r=>r.selection==='dynamic')?'dynamic':live.some(r=>r.selection==='random')?'random':'direct';const first=live[0],labels=[...new Set(live.flatMap(r=>r.menus.map(m=>m.label)))];e.summary=first.itemId?'아이템 설명: '+(first.itemName||first.itemId):labels.length?'메뉴: '+labels.slice(0,3).join(' / '):first.entry?'이벤트: '+first.entry.variable+' = '+first.entry.value:first.location+'에서 이미지 표시';if(first.slot)e.summary+=' · 장면 '+first.slot+'페이지';if(e.status==='random')e.summary+=' · 무작위 후보';if(e.status==='dynamic')e.summary+=' · 동적 조건 추가 확인';}
  else if(e.references.length){e.status=e.references.some(r=>r.kind==='alternate')?'alternate':'definition';const first=e.references[0];e.summary=e.status==='alternate'?'기본 컷이 표시될 때 이미지 전환으로 선택':first.itemName?'아이템 설명: '+first.itemName:'코드/설정 등록은 확인됨 · 실제 호출 조건 추가 확인';}
  else if(e.alternates.length){e.status='alternate';e.summary='추가 컷으로 등록됨 · 기본 컷의 실제 호출은 미확인';}
  e.references.forEach(r=>{delete r.key;});
 }
 const counts={};for(const e of Object.values(entries))counts[e.status]=(counts[e.status]||0)+1;
 return {schema:1,qspSha256:doc.hash,total:files.length,counts,entries,unresolved,limits:['정적 코드 분석이며 실제 세이브 상태나 플레이 성공을 보증하지 않습니다.','주석과 현재 게임 밖의 시안·백업은 등장 근거로 사용하지 않습니다.','정의부·동적 후보·대체컷 등록만으로 일반 플레이에서 등장한다고 단정하지 않습니다.']};
}
module.exports={build,normalize,splitArgs};
