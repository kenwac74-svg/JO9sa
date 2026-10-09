'use strict';
const fs=require('node:fs'),path=require('node:path');
function createJournalModel(entries){
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return {entries,match({selection,context}){
  if(!selection)return [];
  const scope=JSON.stringify({location:selection.location,text:selection.text,scene:context?.scene,texts:context?.texts,images:context?.images?.map(i=>i.path),usage:context?.flow?.usage});
  return [...new Set(entries.filter(e=>e.keywords.some(k=>k.length>=2&&scope.includes(k))||e.ids.some(id=>id.length>=3&&new RegExp('(^|[^A-Za-z0-9_])'+escape(id)+'([^A-Za-z0-9_]|$)','i').test(scope))).map(e=>e.name))];
 },request(keywords){const clean=[...new Set(keywords.map(s=>String(s).trim()).filter(Boolean))];return clean.length?'저널 호출 키워드: '+clean.join(', ')+'\n위 키워드에 연결된 NPC 소개·장소 설명 저널을 참고해 각색하세요. 현재 원문의 사건·분기·화자를 유지하고, 저널에 없는 설정을 만들지 마세요.\n\n':'';}};
}
if(require.main===module){
 const verified=JSON.parse(fs.readFileSync(path.join(__dirname,'../../tmp/kindroid-journals/saved-journals-verified.json'),'utf8'));
 const raw=JSON.parse(fs.readFileSync(path.join(__dirname,'../../tmp/kindroid-journals/entries.json'),'utf8'));
 const entries=[];
 for(const e of verified.entries){let existing=entries.find(v=>v.name===e.name);if(!existing){existing={kind:e.kind,name:e.name,keywords:[],ids:[]};entries.push(existing);}existing.keywords=[...new Set([...existing.keywords,...e.keywords])];existing.ids.push(...(e.sourceIds||[e.id]));}
 for(const d of raw.duplicates){const e=entries.find(e=>e.ids.includes(d.sameAs));if(e)e.ids.push(d.id);}
 fs.writeFileSync(path.join(__dirname,'journal-keywords.json'),JSON.stringify(entries,null,2)+'\n');
 const file=path.join(__dirname,'dialogue-ai.js');let source=fs.readFileSync(file,'utf8');
 source=source.replace(/\/\* JO9_JOURNAL_START \*\/[\s\S]*?\/\* JO9_JOURNAL_END \*\/\r?\n/,'');
 const model='/* JO9_JOURNAL_START */\nwindow.JO9_JOURNAL=('+createJournalModel.toString()+')('+JSON.stringify(entries)+');\n'+fs.readFileSync(path.join(__dirname,'journal-keywords-ui.js'),'utf8')+'\n/* JO9_JOURNAL_END */\n';
 source=model+source;
 if(!source.includes('window.JO9_JOURNAL_SELECT();'))source=source.replace('window.JO9_DIALOGUE_AI_SELECT=function(){','window.JO9_DIALOGUE_AI_SELECT=function(){\n   window.JO9_JOURNAL_SELECT();');
 source=source.replace("message:el('aiCommand').value,reset","message:(window.JO9_JOURNAL_CONTEXT()||'')+(el('aiCommand').value||'원문의 의미와 말투를 살려 각색하고 수정문만 출력하세요.'),reset");
 fs.writeFileSync(file,source);
 const html=path.join(__dirname,'index.html');let page=fs.readFileSync(html,'utf8');
 page=page.replace('const request=`JO9 기존 대사 각색 요청\\n위치:',"const request=`JO9 기존 대사 각색 요청\\n${window.JO9_JOURNAL_CONTEXT?.()||''}위치:");fs.writeFileSync(html,page);
 console.log(JSON.stringify({entries:entries.length,npc:entries.filter(e=>e.kind==='npc').length,place:entries.filter(e=>e.kind==='place').length}));
}
module.exports={createJournalModel};
