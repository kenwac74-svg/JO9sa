'use strict';
// Builds Start-only disposable QSP copies for installed QtWebKit spacing probes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const sc=require('G:/somi/JO9sa/tools/qa/save-codec.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
const out=process.argv[2]||'G:/Codex/tmp/shop-text-quest-20261026/text/spacing';
const sourceFile=game+'/jack.qsp',raw=fs.readFileSync(sourceFile),source=c.parse(raw);
const saveFile=game+'/save/JO9_MANUAL_20261025/01_검사완료재확인/20_traits_overflow_merge.sav';
const savedRaw=fs.readFileSync(saveFile),prime=qa.primeState(sc.parse(savedRaw));
const baseline=game+'/content/js/jo9_word_wrap.js',candidate=__dirname+'/jo9_word_wrap.js';
assert.equal(c.hash(raw),'8b9cf39fe2327079b0823f6e474c93151538a512fa8738ed5f330749a0940db5');
assert.equal(c.hash(fs.readFileSync(candidate)),'fd5d5db466ca9851277c77af4c73398ca12f6e29a0efcb6d6c8a6730430bc237');
assert(path.resolve(out).toLowerCase().startsWith(path.resolve('G:/Codex/tmp/shop-text-quest-20261026/text/spacing').toLowerCase()),'Spacing task directory required');
qa.assertOutside(out,[game,'G:/somi/Jack O Nine Tails v2.4 Kor_Full/game','G:/somi/JO9O']);
assert(!fs.existsSync(out),'Use a fresh disposable spacing directory');
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const script=js=>'*p '+q('<script type="text/javascript">'+js.replace(/\r?\n/g,' ')+'</script>');
const body=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const proseLine=body(source,'jo9_liquidation').split('\r\n').find(l=>l.includes('dynamic $death,')&&l.includes('가구도 집도'));
assert(proseLine);const prose=c.literals(proseLine)[0].text;
const common=String.raw`(function(){
 var tries=0,snapshots=[];
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function rect(r){return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
 function wordRange(node,start,end){
  var r=document.createRange();r.setStart(node,start);r.setEnd(node,end);var rs=r.getClientRects(),tops=[],boxes=[];
  for(var i=0;i<rs.length;i++){boxes.push(rect(rs[i]));var seen=false;for(var j=0;j<tops.length;j++)if(Math.abs(tops[j]-rs[i].top)<.5)seen=true;if(!seen)tops.push(rs[i].top)}
  return {word:r.toString(),lines:tops.length,boxes:boxes,bounds:rect(r.getBoundingClientRect()),parentWhiteSpace:getComputedStyle(node.parentNode).whiteSpace,parentMaxWidth:node.parentNode.style.maxWidth};
 }
 function words(box){var result=[];function visit(n){if(n.nodeType===3){var re=/\S+/g,m;while((m=re.exec(n.nodeValue)))result.push(wordRange(n,m.index,m.index+m[0].length))}else for(var i=0;i<n.childNodes.length;i++)visit(n.childNodes[i])}visit(box);return result}
 function snapshot(box){
  var all=words(box),gaps=[],broken=[],long=[],css=getComputedStyle(box);
  for(var i=0;i<all.length;i++){
   var w=all[i];if(w.lines!==1){if(w.parentMaxWidth&&w.parentWhiteSpace==='normal')long.push(w);else broken.push(w)}
   if(i){var prev=all[i-1];if(prev.lines===1&&w.lines===1&&Math.abs(prev.bounds.top-w.bounds.top)<.5)gaps.push({left:prev.word,right:w.word,gap:w.bounds.left-prev.bounds.right})}
  }
  var expected=document.createElement('span');expected.innerHTML=document.getElementById('qa_spacing_expected').value;
  var overflowWords=[];var bounds=box.getBoundingClientRect(),left=bounds.left+(parseFloat(css.paddingLeft)||0),right=bounds.right-(parseFloat(css.paddingRight)||0);
  for(i=0;i<all.length;i++)if(all[i].bounds.left<left-1||all[i].bounds.right>right+1)overflowWords.push(all[i]);
  return {text:box.textContent,expectedText:expected.textContent,textUnchanged:box.textContent===expected.textContent,fontFamily:css.fontFamily,fontSize:css.fontSize,lineHeight:css.lineHeight,bounds:rect(bounds),expectedPanelWidth:__EXPECTED_WIDTH__,panelWidthUnchanged:Math.abs(bounds.width-__EXPECTED_WIDTH__)<1,viewport:[window.innerWidth,window.innerHeight],outsideViewport:bounds.right>window.innerWidth+1||bounds.left<-1,clientWidth:box.clientWidth,scrollWidth:box.scrollWidth,clientHeight:box.clientHeight,scrollHeight:box.scrollHeight,wordWrapStatus:box.getAttribute('data-jo9-word-wrap'),helperSpans:box.querySelectorAll('.jo9_word').length,allWords:all,gaps:gaps,minSameLineGap:gaps.length?Math.min.apply(Math,gaps.map(function(v){return v.gap})):null,brokenWords:broken,fallbackWords:long,overflowWords:overflowWords,horizontalOverflow:box.scrollWidth>box.clientWidth+1,verticalOverflow:box.scrollHeight>box.clientHeight+1};
 }
 function emit(ok,data){var a=document.createElement('a');a.href="EXEC: $qa_spacing_metrics='"+JSON.stringify(data).replace(/'/g,"''")+"' & savegame '__CASE__.sav' & msg '"+(ok?'JO9_QA_SPACING___CASE_UNDERSCORE___COMPLETE':'FAIL_SPACING___CASE_UNDERSCORE__')+"'";document.body.appendChild(a);click(a)}
 function run(){
  var box=document.getElementById('__BOX__'),expected=document.getElementById('qa_spacing_expected');
  if(!box||!expected||box.getAttribute('data-jo9-word-wrap')!=='1'){if(++tries<160)setTimeout(run,50);else emit(false,{error:'NO_READY_BOX',caseName:'__CASE__'});return}
  snapshots.push(snapshot(box));if(snapshots.length<2){setTimeout(run,600);return}
  var last=snapshots[snapshots.length-1],ok=last.textUnchanged&&last.allWords.length>0&&last.gaps.length>0&&last.brokenWords.length===0&&!last.horizontalOverflow&&!last.verticalOverflow&&last.overflowWords.length===0&&last.panelWidthUnchanged&&!last.outsideViewport;
  if(__BASELINE__)ok=ok&&last.minSameLineGap<=1;else ok=ok&&last.minSameLineGap>1;
  if(__FALLBACK__)ok=ok&&last.fallbackWords.length===1&&last.fallbackWords[0].lines>1;else ok=ok&&last.fallbackWords.length===0;
  emit(ok,{caseName:'__CASE__',baseline:__BASELINE__,fallback:__FALLBACK__,snapshots:snapshots});
 }
 setTimeout(run,300);
}());`;
const baseSetup=()=>['killall','settimer 0',prime.code,"$counter=''","$ongload=''","$onnewloc=''",'usehtml=1','nsfw=1','sound_on=0','settimer 0','autosave=0','decadesave=0','autosave_day=0','autosave_decade=0','snk_room_target=0','is_home=1','city_district=-1','ui_style=2',"gs 'refresh_database'","$counter=''","$ongload=''","$onnewloc=''",'slave_stat_screen=0',"slave['jo9_constitution']=1",'slave_state=1','slave_health=5'];
const variants=[{name:'baseline',js:baseline,cases:[{name:'healthy-baseline',kind:'healthy',baseline:true},{name:'gameover-baseline',kind:'gameover',baseline:true}]},{name:'candidate',js:candidate,cases:[{name:'healthy-candidate',kind:'healthy'},{name:'gameover-candidate',kind:'gameover'},{name:'token-hangul',kind:'fallback',token:'가'.repeat(120)},{name:'token-latin',kind:'fallback',token:'W'.repeat(180)},{name:'token-url',kind:'fallback',token:'https://example.invalid/'+('segment'.repeat(36))}]}];
const prepared={sourceFile,sourceHash:c.hash(raw),saveFile,saveHash:c.hash(savedRaw),baselineJsHash:c.hash(fs.readFileSync(baseline)),candidateJsHash:c.hash(fs.readFileSync(candidate)),startOnly:true,variants:[]};
for(const variant of variants){
 const dir=out+'/'+variant.name;fs.mkdirSync(dir+'/content/js',{recursive:true});
 for(const ent of fs.readdirSync(game+'/content',{withFileTypes:true})){if(ent.name==='js')continue;const target=dir+'/content/'+ent.name;if(ent.isDirectory())fs.symlinkSync(game+'/content/'+ent.name,target,'junction');else fs.copyFileSync(game+'/content/'+ent.name,target);}
 fs.cpSync(game+'/content/js',dir+'/content/js',{recursive:true});fs.copyFileSync(variant.js,dir+'/content/js/jo9_word_wrap.js');
 for(const name of ['css','fonts'])fs.symlinkSync(game+'/'+name,dir+'/'+name,'junction');
 const reusableJson='G:/Codex/tmp/shop-text-quest-20261026/text/spacing/baseline/json';
 if(path.resolve(out)!==path.resolve('G:/Codex/tmp/shop-text-quest-20261026/text/spacing')&&fs.existsSync(reusableJson))fs.symlinkSync(reusableJson,dir+'/json','junction');else fs.cpSync(game+'/json',dir+'/json',{recursive:true});
 fs.copyFileSync(game+'/config.xml',dir+'/config.xml');fs.writeFileSync(dir+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
 const plan=[];
 for(const probe of variant.cases){
  const doc=c.parse(raw),setup=baseSetup();let expected,render,box;
  if(probe.kind==='gameover'){expected=q(prose);render="gs 'exit', $qa_spacing_expected";box='jo9_gameover_message';}
  else {expected=probe.kind==='healthy'?"$func('jo9_traits', 'text', 'healthy')":q('[긴 토큰 검사]<br>첫 단어 '+probe.token+' 끝 단어');render="$info_text=$qa_spacing_expected\r\ngs 'slave_stat'";box='info';}
  const driver=common.replaceAll('__CASE_UNDERSCORE__',probe.name.replaceAll('-','_')).replaceAll('__CASE__',probe.name).replaceAll('__BOX__',box).replaceAll('__BASELINE__',probe.baseline?'true':'false').replaceAll('__FALLBACK__',probe.kind==='fallback'?'true':'false').replaceAll('__EXPECTED_WIDTH__',probe.kind==='gameover'?'830':'760');
  setup.push('$qa_spacing_expected='+expected,render,"*p '<textarea id=\"qa_spacing_expected\" style=\"display:none\"><<$qa_spacing_expected>></textarea>'",script(driver));
  const start=doc.locations.find(l=>l.name==='Start');doc.lines[start.body]=c.shift(setup.join('\r\n'),-5);
  for(let i=0;i<source.lines.length;i++)if(i!==start.body)assert.equal(doc.lines[i],source.lines[i],'Only Start may be modified');
  const bytes=c.serialize(doc);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));
  const file=dir+'/'+probe.name+'.qsp';fs.writeFileSync(file,bytes);plan.push({name:probe.name,file,marker:'JO9_QA_SPACING_'+probe.name.replaceAll('-','_')+'_COMPLETE',checkpoint:'Start-only actual '+box+' rendering; excludes trailing spaces in word Range; text, visible gaps, word lines and panel overflow measured'});
 }
 fs.writeFileSync(dir+'/plan.json',JSON.stringify(plan,null,2)+'\n');prepared.variants.push({name:variant.name,dir,plan});
}
assert(fs.readFileSync(sourceFile).equals(raw));assert(fs.readFileSync(saveFile).equals(savedRaw));
fs.writeFileSync(out+'/prepared.json',JSON.stringify(prepared,null,2)+'\n');
console.log(JSON.stringify({out,sourceHash:prepared.sourceHash,baselineJsHash:prepared.baselineJsHash,candidateJsHash:prepared.candidateJsHash,startOnly:true,cases:prepared.variants.reduce((n,v)=>n+v.plan.length,0)},null,2));
