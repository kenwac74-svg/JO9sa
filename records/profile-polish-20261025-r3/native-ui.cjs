'use strict';
// Prepare isolated native QtWebKit display probes. Never writes WORK or existing saves.
// Root executes run-client-smoke.ps1 against the generated plan after final candidate build.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',task=path.resolve('G:/Codex/tmp/profile-polish-20261025-r3');
const input=path.resolve(process.argv[2]||task+'/candidate.qsp'),out=path.resolve(process.argv[3]||task+'/native-ui');
const gameoverOnly=process.argv[4]==='gameover-only';
const rel=path.relative(task,out);
assert(rel&&!rel.startsWith('..')&&!path.isAbsolute(rel),'Disposable task subdirectory required');
qa.assertOutside(out,[game,'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game','G:/somi/JO9O']);
assert(!fs.existsSync(out),'Use a fresh diagnostic output directory');
const raw=fs.readFileSync(input),source=c.parse(raw),plans=[],evidence=[];
assert(c.serialize(source).equals(raw));qa.inspectWorld(raw);
const savedFile=game+'/save/JO9_MANUAL_20261025/01_검사완료재확인/20_traits_overflow_merge.sav';
const savedRaw=fs.readFileSync(savedFile),saved=sc.parse(savedRaw),prime=qa.primeState(saved);
const q=s=>"'"+String(s).replaceAll("'","''")+"'",cr=s=>s.replace(/\r?\n/g,'\r\n');
const script=js=>'*p '+q('<script type="text/javascript">'+js.replace(/\r?\n/g,' ')+'</script>');
function get(d,n){const l=d.locations.find(l=>l.name===n);assert(l,'Missing location '+n);return c.shift(d.lines[l.body],5);}
function set(d,n,text){const l=d.locations.find(l=>l.name===n);assert(l);d.lines[l.body]=c.shift(cr(text),-5);}
function add(d,n,text){assert(!d.locations.find(l=>l.name===n));d.lines[3]=c.shift(String(d.locations.length+1),-5);d.lines.splice(d.lines.length-1,0,c.shift(n,-5),c.shift('',-5),c.shift(cr(text),-5),c.shift('0',-5));}
function baseSetup(){return ['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''",'usehtml=1','nsfw=1','sound_on=0','settimer 0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','snk_room_target=0','is_home=1','city_district=-1','ui_style=2'];}
function finish(d,name,marker,checkpoint){
 const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));
 const file=out+'/'+name+'.qsp';fs.writeFileSync(file,bytes);plans.push({name,file,marker,checkpoint});
 evidence.push({name,sha256:c.hash(bytes)});
}
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(out+'/content/js',{recursive:true});fs.mkdirSync(out+'/css',{recursive:true});
for(const ent of fs.readdirSync(game+'/content',{withFileTypes:true})){
 if(ent.name==='js')continue;const to=out+'/content/'+ent.name;
 if(ent.isDirectory())fs.symlinkSync(game+'/content/'+ent.name,to,'junction');else fs.copyFileSync(game+'/content/'+ent.name,to);
}
fs.cpSync(game+'/content/js',out+'/content/js',{recursive:true});fs.cpSync(game+'/css',out+'/css',{recursive:true});
for(const [from,to]of [['jo9_traits_view.js','content/js/jo9_traits_view.js'],['jo9_traits_view.css','css/jo9_traits_view.css']])fs.copyFileSync(__dirname+'/'+from,out+'/'+to);
if(fs.existsSync(__dirname+'/jo9_word_wrap.js'))fs.copyFileSync(__dirname+'/jo9_word_wrap.js',out+'/content/js/jo9_word_wrap.js');
fs.symlinkSync(game+'/fonts',out+'/fonts','junction');fs.cpSync(game+'/json',out+'/json',{recursive:true});
fs.copyFileSync(game+'/config.xml',out+'/config.xml');fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');

const profileDriver=String.raw`(function(){
 var tries=0;
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function fail(s,metric){var a=document.createElement('a');a.href="EXEC: "+(metric?"$qa_polish_metrics='"+metric.replace(/'/g,"''")+"' & savegame 'profile-ui-fail.sav' & ":'')+"msg 'FAIL_POLISH_UI_"+s+"'";document.body.appendChild(a);click(a)}
 function top(a){a.scrollIntoView(false);var r=a.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return r.width>0&&r.height>0&&h&&a.contains(h)}
 function size(n){return parseFloat(getComputedStyle(n).fontSize)}
 function rangeData(node,at,end){var r=document.createRange();r.setStart(node,at);r.setEnd(node,end);var rs=r.getClientRects(),tops=[],boxes=[];for(var j=0;j<rs.length;j++){var seen=false;for(var k=0;k<tops.length;k++)if(Math.abs(tops[k]-rs[j].top)<.5)seen=true;if(!seen)tops.push(rs[j].top);boxes.push({left:rs[j].left,top:rs[j].top,right:rs[j].right,bottom:rs[j].bottom})}return {word:r.toString(),rects:rs.length,lines:tops.length,lineTops:tops,boxes:boxes}}
 function words(box){var rows=[];function walk(n){if(n.nodeType===3){var re=/\S+/g,m;while((m=re.exec(n.nodeValue)))rows.push(rangeData(n,m.index,m.index+m[0].length))}else for(var i=0;i<n.childNodes.length;i++)walk(n.childNodes[i])}walk(box);return rows}
 function findWord(n,word){if(n.nodeType===3){var at=n.nodeValue.indexOf(word);if(at>=0)return rangeData(n,at,at+word.length)}for(var i=0;i<n.childNodes.length;i++){var found=findWord(n.childNodes[i],word);if(found)return found}return null}
 function run(){
  var api=window.JO9TraitView;
  if(!api||api.root.getAttribute('data-ready')!=='1'){if(++tries<120)setTimeout(run,40);else fail('NO_API');return}
  api.measure();
  var column=api.root.parentElement,gaps=column.querySelectorAll('.jo9_profile_group_gap'),gapOK=gaps.length===4;
  for(var i=0;i<gaps.length;i++)if(Math.abs(gaps[i].getBoundingClientRect().height-10)>.2)gapOK=false;
  var edge=getComputedStyle(document.body,':before'),edgeOK=parseFloat(edge.top)===0&&parseFloat(edge.height)===800;
  var fontOK=Math.abs(size(api.list)-16)<.1&&Math.abs(size(api.panel)-20)<.1;
  var expected={'0':'rgb(205, 0, 0)','1':'rgb(234, 0, 144)','4':'rgb(0, 159, 239)','5':'rgb(0, 153, 0)'},grades={},titles=0,colorsOK=true,entries=api.list.children,attention=0;
  for(i=0;i<entries.length;i++){
   var n=entries[i],kind=n.getAttribute('data-kind'),grade=n.getAttribute('data-grade'),col=getComputedStyle(n).color;
   if(Math.abs(size(n)-16)>.1)fontOK=false;
   if(kind==='title'){titles++;if(col!=='rgb(92, 53, 29)')colorsOK=false;var child=n.querySelector('font,span');if(child&&getComputedStyle(child).color!=='rgb(92, 53, 29)')colorsOK=false}
   else if(expected[grade]){grades[grade]=1;if(col!==expected[grade])colorsOK=false}
   if((n.textContent||n.innerText)==='관심종자')attention++;
  }
  var metadata=api.root.querySelectorAll('textarea[data-index]'),metaOK=true,metas=0;
  for(i=0;i<metadata.length;i++){
   if(metadata[i].getAttribute('data-index')==='0')continue;
   var desc=metadata[i].value.replace(/<!--[\s\S]*?-->/g,'');
   if(!/^\[[^\]\r\n]+\]<br>/.test(desc))metaOK=false;metas++;
  }
  var overflow=api.root.getAttribute('data-overflow')==='1',footerOK=overflow&&!api.footer.hidden&&api.footer.textContent==='특성 전체보기';
  if(overflow){var stop=api.footer.getBoundingClientRect().top;for(i=0;i<entries.length;i++)if(getComputedStyle(entries[i]).display!=='none'&&entries[i].getBoundingClientRect().bottom>stop)footerOK=false}
  if(!edgeOK||!gapOK||!fontOK||!colorsOK||!metaOK||!footerOK||attention!==1||!grades['0']||!grades['1']||!grades['5']||titles<1){fail('STYLE_'+Number(edgeOK)+Number(gapOK)+Number(fontOK)+Number(colorsOK)+Number(metaOK)+Number(footerOK)+'_ATT'+attention);return}
  for(i=0;i<api.columns.length;i++){var panelRows=api.columns[i].children;for(var j=0;j<panelRows.length;j++)if(Math.abs(size(panelRows[j])-20)>.1){fail('PANEL_FONT');return}}
  var metrics=JSON.stringify({edge:{top:edge.top,height:edge.height},gaps:[].map.call(gaps,function(n){return n.getBoundingClientRect().height}),leftFont:size(api.list),panelFont:size(api.panel),grades:grades,titles:titles,metadata:metas,metadataFormat:metaOK,attentionRows:attention,footer:api.footer.textContent,overflow:overflow,columns:[].map.call(api.columns,function(n){return n.children.length})});
  var opened=api.root.getAttribute('data-open')==='1',a=null;
  var info=document.getElementById('info');
  if(opened&&info&&info.textContent.indexOf('[관심종자]')>=0&&info.textContent.indexOf('좋은')>=0){
   var expectedText=null;
   for(i=0;i<metadata.length;i++)if(/jo9_attention_text/.test(metadata[i].getAttribute('data-action')||'')){var plain=document.createElement('span');plain.innerHTML=metadata[i].value.replace(/<!--[\s\S]*?-->/g,'');expectedText=plain.textContent;break}
   var all=words(info),broken=[],target=findWord(info,'좋은');for(i=0;i<all.length;i++)if(all[i].lines!==1)broken.push(all[i]);
   var textOK=expectedText!==null&&info.textContent===expectedText;
   if((!target||target.lines!==1||broken.length)&&++tries<100){setTimeout(run,40);return}
   var data=JSON.parse(metrics);data.infoWrap={textUnchanged:textOK,expectedText:expectedText,actualText:info.textContent,target:target,totalWords:all.length,brokenWords:broken,allWords:all,helperSpans:info.querySelectorAll('span').length};metrics=JSON.stringify(data);
   if(!textOK||!target||target.lines!==1||broken.length){fail('INFO_WORD_WRAP',metrics);return}
   a=document.createElement('a');a.href="EXEC: $qa_polish_metrics='"+metrics.replace(/'/g,"''")+"' & gs 'qa_polish_ui_done'";document.body.appendChild(a);click(a);return;
  }
  if(!opened)a=api.footer;else{var candidates=api.panel.querySelectorAll('.jo9_tv_entry');for(i=0;i<candidates.length;i++)if((candidates[i].textContent||candidates[i].innerText)==='관심종자'){a=candidates[i];break}}
  if(!a||!top(a)){fail('OCCLUDED');return}
  var old=a.getAttribute('href').replace(/^exec:\s*/i,''),prefix="EXEC: $qa_polish_metrics='"+metrics.replace(/'/g,"''")+"' & qa_polish_pass=1 & qa_polish_clicks+=1 & ";
  a.setAttribute('href',prefix+old);click(a);
 }
 setTimeout(run,250);
}());`;

if(!gameoverOnly)for(const role of ['slave','assistant']){
 const d=c.parse(raw),marker='JO9_QA_POLISHUI_'+role+'_COMPLETE';
 const flags={jo9_learning_trait:-1,jo9_gag_reflex:1,jo9_constitution:1,jo9_combat_trait:3,jo9_focus:-1,jo9_focus_known:1,jo9_grudge:1,jo9_grudge_known:1,jo9_versatile:1,grace:1,arena_level:5,jo9_attention:1,jo9_attention_known:2};
 const setup=baseSetup().concat(["gs 'refresh_database'","gs '#static_base'","gs '#static_txt'","gs '#variative'","$counter=''","$onnewloc=''","$ongload=''",'qa_polish_clicks=0','qa_polish_pass=0',...Object.entries(flags).map(([k,v])=>`${role}['${k}']=${v}`),role+'_stat_screen=0',"$jo9_tv_reopen_key=''","$info_text=''",`gs '${role}_stat'`]);
 set(d,role+'_stat',get(d,role+'_stat')+'\r\n'+script(profileDriver));set(d,'Start',setup.join('\r\n'));
 add(d,'qa_polish_ui_done',[
 "if qa_polish_pass ! 1 or qa_polish_clicks ! 2: msg 'FAIL_POLISH_UI_CLICK_COUNT' & exit",
 "if instr($info_text, '[관심종자]<br>') ! 1: msg 'FAIL_POLISH_UI_INFO_HEADING' & exit",
 "if instr($info_text, '주목의 중심') > 0 or instr($info_text, '다른 사람의 관심과 칭찬') = 0: msg 'FAIL_POLISH_UI_ATTENTION_BODY' & exit",
 "savegame '"+role+"-profile-ui.sav'",'msg '+q(marker)
 ].join('\r\n'));
 finish(d,role+'-profile',marker,'Real native slave/assistant profile: four10px gaps,16px sidebar/20px panel, continuous edge, semantic colors, overflow footer, metadata [heading]<br>, 관심종자 click, unchanged lower-description text and every word/좋은 kept on one line.');
}

if(!gameoverOnly)for(const entry of ['$ongload','$newloc']){
 const d=c.parse(raw),name=entry==='$ongload'?'load-cache':'newloc-cache',suffix=entry==='$ongload'?'load_cache':'newloc_cache',marker='JO9_QA_POLISHUI_'+suffix+'_COMPLETE';
 const tag='! JO9 MOD END PROFILE_TEXT_CACHE_20261025',body=get(d,entry);assert.equal(body.split(tag).length-1,1);
 const checks=[
 "if jo9_profile_text_revision ! 2: msg 'FAIL_POLISH_CACHE_REVISION' & exit",
 "if instr($jo9_genius_text,'[천재]<br>') ! 1 or instr($jo9_idiot_text,'[백치]<br>') ! 1: msg 'FAIL_POLISH_CACHE_TEXT' & exit",
 "if instr($jo9_attention_text,'[관심종자]<br>') ! 1 or instr($jo9_attention_text,'주목의 중심') > 0: msg 'FAIL_POLISH_CACHE_ATTENTION' & exit",
 "if instr($update_slave_features_list,'관심종자') = 0 or instr($update_slave_features_list,'주목욕구') > 0: msg 'FAIL_POLISH_CACHE_BUILDER' & exit",
 "if instr($scars_chart,'[흉터]<br>') ! 1: msg 'FAIL_POLISH_CACHE_CHART' & exit",
 "savegame '"+name+".sav'",'msg '+q(marker),'exit'
 ].join('\r\n');
 set(d,entry,body.replace(tag,()=>tag+'\r\n'+checks+'\r\n'));
 const setup=baseSetup().concat(['jo9_profile_text_revision=1',"$jo9_genius_text='OLD'","$jo9_idiot_text='OLD'","$jo9_attention_text='주목의 중심'","$update_slave_features_list='주목욕구'","$scars_chart='OLD'","gs '"+entry+"'"]);
 set(d,'Start',setup.join('\r\n'));finish(d,name,marker,'Production cache hook entered from revision1 refreshes #static_base/#static_txt/#variative before navigation; assertions stop immediately after actual hook.');
}

{
 const d=c.parse(raw),marker='JO9_QA_POLISHUI_gameover_wrap_COMPLETE';
 const proseLine=get(d,'jo9_liquidation').split('\r\n').find(l=>l.includes("dynamic $death,")&&l.includes('가구도 집도'));
 assert(proseLine);const prose=c.literals(proseLine)[0].text;
 const driver=String.raw`(function(){
 var tries=0,snapshots=[];
 var expectedNode=document.createElement('span');expectedNode.innerHTML=__EXPECTED_HTML_JSON__;var expectedText=expectedNode.textContent;
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function emit(ok,metric,why){
  var a=document.createElement('a'),status=ok?'JO9_QA_POLISHUI_gameover_wrap_COMPLETE':'FAIL_POLISH_GAMEOVER_WRAP_'+why;
  a.href="EXEC: $qa_wrap_metrics='"+metric.replace(/'/g,"''")+"' & savegame 'gameover-wrap-"+(ok?'pass':'fail')+".sav' & msg '"+status+"'";
  document.body.appendChild(a);click(a);
 }
 function rect(r){return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
 function rangeData(node,at,end){
  var r=document.createRange();r.setStart(node,at);r.setEnd(node,end);var rs=r.getClientRects(),boxes=[],tops=[];
  for(var j=0;j<rs.length;j++){boxes.push(rect(rs[j]));var seen=false;for(var k=0;k<tops.length;k++)if(Math.abs(tops[k]-rs[j].top)<.5)seen=true;if(!seen)tops.push(rs[j].top)}
  return {word:r.toString(),rects:rs.length,lines:tops.length,lineTops:tops,boxes:boxes,bounds:rect(r.getBoundingClientRect())};
 }
 function allWords(box){var rows=[];function walk(n){if(n.nodeType===3){var re=/\S+/g,m;while((m=re.exec(n.nodeValue)))rows.push(rangeData(n,m.index,m.index+m[0].length))}else for(var i=0;i<n.childNodes.length;i++)walk(n.childNodes[i])}walk(box);return rows}
 function find(node,word){
  if(node.nodeType===3){var at=node.nodeValue.indexOf(word);if(at>=0){
   var result=rangeData(node,at,at+word.length),p=node.parentNode,css=getComputedStyle(p);
   result.parentTag=p.tagName;result.parentDisplay=css.display;result.parentWhiteSpace=css.whiteSpace;return result;
  }}
  for(var i=0;i<node.childNodes.length;i++){var found=find(node.childNodes[i],word);if(found)return found}return null;
 }
 function snapshot(box){
  var css=getComputedStyle(box),all=allWords(box),broken=[];for(var i=0;i<all.length;i++)if(all[i].lines!==1)broken.push(all[i]);
  return {timeMs:snapshots.length?800:250,inlineStyle:box.getAttribute('style'),wordBreak:css.wordBreak,wordWrap:css.wordWrap,overflowWrap:css.overflowWrap,whiteSpace:css.whiteSpace,display:css.display,fontFamily:css.fontFamily,fontSize:css.fontSize,lineHeight:css.lineHeight,words:[find(box,'모자랐다'),find(box,'경매장')],totalWords:all.length,allWords:all,brokenWords:broken,expectedText:expectedText,textUnchanged:box.textContent===expectedText,helperSpans:box.querySelectorAll('span').length,clientHeight:box.clientHeight,scrollHeight:box.scrollHeight,bounds:rect(box.getBoundingClientRect()),viewport:[window.innerWidth,window.innerHeight],text:box.textContent};
 }
 function run(){
  var box=document.getElementById('jo9_gameover_message');
  if(!box){if(++tries<120)setTimeout(run,40);else emit(false,JSON.stringify({error:'NO_BOX'}),'NO_BOX');return}
  snapshots.push(snapshot(box));if(snapshots.length<2){setTimeout(run,550);return}
  var last=snapshots[snapshots.length-1],ok=last.textUnchanged&&last.totalWords>0&&last.brokenWords.length===0,why=[];
  if(!last.textUnchanged)why.push('TEXT_CHANGED');if(last.brokenWords.length)why.push('BROKEN'+last.brokenWords.length);
  for(var i=0;i<last.words.length;i++){if(!last.words[i]){ok=false;why.push('MISSING'+i)}else if(last.words[i].lines!==1){ok=false;why.push('LINES'+i+'N'+last.words[i].lines)}}
  emit(ok,JSON.stringify({snapshots:snapshots,reasons:why}),why.join('_')||'UNKNOWN');
 }
 setTimeout(run,250);
}());`.replace('__EXPECTED_HTML_JSON__',JSON.stringify(prose));
 set(d,'exit',get(d,'exit')+'\r\n'+script(driver));
 set(d,'Start',baseSetup().concat(["gt 'exit',"+q(prose)]).join('\r\n'));
 finish(d,'gameover-wrap',marker,'Actual exit screen: original textContent must remain byte-identical; every word plus 모자랐다/경매장 occupies one line. CSS keep-all recognition is recorded but not required. Both pass/fail save DOM/font/Range evidence.');
}

fs.writeFileSync(out+'/plan.json',JSON.stringify(plans,null,2)+'\n');
fs.writeFileSync(out+'/prepared.json',JSON.stringify({input,sourceHash:c.hash(raw),save:savedFile,saveHash:c.hash(savedRaw),jsHash:c.hash(fs.readFileSync(__dirname+'/jo9_traits_view.js')),cssHash:c.hash(fs.readFileSync(__dirname+'/jo9_traits_view.css')),wordWrapHash:fs.existsSync(__dirname+'/jo9_word_wrap.js')?c.hash(fs.readFileSync(__dirname+'/jo9_word_wrap.js')):null,cases:evidence,limits:['Diagnostics only. Runtime and input saves are never written.','Profile setup primes a complete adult fixture for rendering; this is not proof of native Save/Load compatibility. Root should separately load old R2 files to confirm cached HTML refresh.','Metrics are computed by the installed QtWebKit. No screenshot pixel comparison.']},null,2)+'\n');
console.log(JSON.stringify({out,cases:plans.length,sourceHash:c.hash(raw),preparedOnly:true}));
