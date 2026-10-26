'use strict';
// Diagnostic-only variant: test legacy WebKit line-break without altering product files.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const task='G:/Codex/tmp/profile-polish-20261025-r3',out=task+'/wrap-webkit';
const sourcePrepared=JSON.parse(fs.readFileSync(task+'/native-ui/prepared.json','utf8'));
assert.equal(sourcePrepared.sourceHash,'05f0f4c3f7b05d4c0ea1dc5e1f49c96b52d01c466aa15b6ef8fe6d69350fc73a');
qa.assertOutside(out,['G:/somi/Jack O Nine Tails v2.4_work/game','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game','G:/somi/JO9O']);
assert(!fs.existsSync(out));fs.mkdirSync(out);
for(const n of ['content','css','fonts'])fs.symlinkSync(task+'/native-ui/'+n,out+'/'+n,'junction');
fs.cpSync(task+'/native-ui/json',out+'/json',{recursive:true});fs.copyFileSync(task+'/native-ui/config.xml',out+'/config.xml');
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const q=s=>"'"+String(s).replaceAll("'","''")+"'",script=js=>'*p '+q('<script type="text/javascript">'+js.replace(/\r?\n/g,' ')+'</script>');
const get=(d,n)=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const set=(d,n,b)=>{d.lines[d.locations.find(l=>l.name===n).body]=c.shift(b,-5);};
const common=String.raw`
 function click(a){var e=document.createEvent('MouseEvents');e.initMouseEvent('click',true,true,window,1,0,0,0,0,false,false,false,false,0,null);a.dispatchEvent(e)}
 function rect(r){return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
 function spanRange(node,at,end){
  var r=document.createRange();r.setStart(node,at);r.setEnd(node,end);var rs=r.getClientRects(),boxes=[],tops=[];
  for(var j=0;j<rs.length;j++){boxes.push(rect(rs[j]));var seen=false;for(var k=0;k<tops.length;k++)if(Math.abs(tops[k]-rs[j].top)<.5)seen=true;if(!seen)tops.push(rs[j].top)}
  return {word:r.toString(),rects:rs.length,lines:tops.length,lineTops:tops,boxes:boxes,bounds:rect(r.getBoundingClientRect())};
 }
 function allWords(box){
  var rows=[];
  function walk(n){if(n.nodeType===3){var re=/\S+/g,m;while((m=re.exec(n.nodeValue)))rows.push(spanRange(n,m.index,m.index+m[0].length))}else for(var i=0;i<n.childNodes.length;i++)walk(n.childNodes[i])}
  walk(box);return rows;
 }
 function find(box,word){if(box.nodeType===3){var at=box.nodeValue.indexOf(word);if(at>=0)return spanRange(box,at,at+word.length)}for(var i=0;i<box.childNodes.length;i++){var found=find(box.childNodes[i],word);if(found)return found}return null}
 function snapshot(box,targetWords,timeMs){
  var css=getComputedStyle(box),all=allWords(box),targets=[],broken=[];
  for(var i=0;i<targetWords.length;i++)targets.push(find(box,targetWords[i]));
  for(i=0;i<all.length;i++)if(all[i].lines!==1)broken.push(all[i]);
  return {timeMs:timeMs,inlineStyle:box.getAttribute('style'),wordBreak:css.wordBreak,webkitLineBreak:css.webkitLineBreak,vendorProperty:css.getPropertyValue('-webkit-line-break'),wordWrap:css.wordWrap,whiteSpace:css.whiteSpace,display:css.display,fontSize:css.fontSize,lineHeight:css.lineHeight,bounds:rect(box.getBoundingClientRect()),clientHeight:box.clientHeight,scrollHeight:box.scrollHeight,totalWords:all.length,brokenWords:broken,targets:targets,allWords:all};
 }
 function emit(ok,metric,kind){var a=document.createElement('a');a.href="EXEC: $qa_wrap_metrics='"+metric.replace(/'/g,"''")+"' & savegame '"+kind+"-"+(ok?'pass':'fail')+".sav' & msg '"+(ok?'JO9_QA_POLISHUI_'+kind.replace(/-/g,'_')+'_COMPLETE':'FAIL_POLISH_'+kind.replace(/-/g,'_'))+"'";document.body.appendChild(a);click(a)}
`;
const endingDriver='(function(){var tries=0,snapshots=[];'+common+String.raw`
 function run(){
  var box=document.getElementById('jo9_gameover_message');if(!box){if(++tries<120)setTimeout(run,40);else emit(false,JSON.stringify({error:'NO_BOX'}),'gameover-webkit');return}
  snapshots.push(snapshot(box,['모자랐다','경매장'],snapshots.length?800:250));if(snapshots.length<2){setTimeout(run,550);return}
  var last=snapshots[1],ok=last.totalWords>0&&last.brokenWords.length===0;
  for(var i=0;i<last.targets.length;i++)if(!last.targets[i]||last.targets[i].lines!==1)ok=false;
  emit(ok,JSON.stringify({variant:'Only added -webkit-line-break:after-white-space to original inline style',keepAllRequired:false,snapshots:snapshots}),'gameover-webkit');
 }
 setTimeout(run,250);
}());`;
const attentionDriver='(function(){var tries=0,snapshots=[];'+common+String.raw`
 function run(){
  var box=document.getElementById('info');
  if(!box||box.textContent.indexOf('[관심종자]')<0||box.textContent.indexOf('좋은')<0){if(++tries<150)setTimeout(run,80);else emit(false,JSON.stringify({error:'NO_ATTENTION_INFO'}),'attention-webkit');return}
  if(!box.getAttribute('data-qa-webkit-ready')){box.style.setProperty('-webkit-line-break','after-white-space');box.setAttribute('data-qa-webkit-ready','1');setTimeout(run,250);return}
  snapshots.push(snapshot(box,['좋은'],snapshots.length?800:250));if(snapshots.length<2){setTimeout(run,550);return}
  var last=snapshots[1],ok=last.totalWords>0&&last.brokenWords.length===0&&last.targets[0]&&last.targets[0].lines===1;
  emit(ok,JSON.stringify({variant:'Only added -webkit-line-break:after-white-space to actual #info DOM style',keepAllRequired:false,snapshots:snapshots}),'attention-webkit');
 }
 setTimeout(run,300);
}());`;
const plan=[];
{
 const input=task+'/wrap-investigate/gameover-wrap.qsp',raw=fs.readFileSync(input),d=c.parse(raw);let body=get(d,'exit');
 assert.equal(body.split('word-break:keep-all;').length-1,1);
 body=body.replace('word-break:keep-all;','word-break:keep-all;-webkit-line-break:after-white-space;');
 const lines=body.split('\r\n'),at=lines.findIndex(l=>l.startsWith('*p ')&&l.includes('qa_wrap_metrics'));assert(at>=0);
 lines[at]=script(endingDriver);set(d,'exit',lines.join('\r\n'));
 const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));
 const file=out+'/gameover-webkit.qsp';fs.writeFileSync(file,bytes);
 plan.push({name:'gameover-webkit',file,marker:'JO9_QA_POLISHUI_gameover_webkit_COMPLETE',checkpoint:'Same exit fixture plus only legacy -webkit-line-break inline style. Vendor computed property and every space-delimited word Range measured. keep-all recognition is not a pass requirement.'});
}
{
 const input=task+'/native-ui/slave-profile.qsp',raw=fs.readFileSync(input),d=c.parse(raw);let body=get(d,'slave_stat');
 const lines=body.split('\r\n'),at=lines.findIndex(l=>l.startsWith('*p ')&&l.includes('qa_polish_metrics'));assert(at>=0);
 const literal=c.literals(lines[at])[0];assert(literal);let driver=literal.text;
 const callback="a.setAttribute('href',prefix+old+(opened?\" & gs 'qa_polish_ui_done'\":\"\"));click(a);";
 assert.equal(driver.split(callback).length-1,1);driver=driver.replace(callback,"a.setAttribute('href',prefix+old);click(a);");
 const opened="var opened=api.root.getAttribute('data-open')==='1',a=null;";assert.equal(driver.split(opened).length-1,1);
 driver=driver.replace(opened,opened+" var info=document.getElementById('info');if(opened&&info&&info.textContent.indexOf('[관심종자]')>=0&&info.textContent.indexOf('좋은')>=0)return;");
 lines[at]='*p '+q(driver);lines.push(script(attentionDriver));set(d,'slave_stat',lines.join('\r\n'));
 const bytes=c.serialize(d);qa.inspectWorld(bytes);assert(c.serialize(c.parse(bytes)).equals(bytes));
 const file=out+'/attention-webkit.qsp';fs.writeFileSync(file,bytes);
 plan.push({name:'attention-webkit',file,marker:'JO9_QA_POLISHUI_attention_webkit_COMPLETE',checkpoint:'Original profile footer and actual 관심종자 click run first, then only vendor line-break is added to #info. Measures 좋은 and every space-delimited word Range, keeping original fonts and geometry.'});
}
fs.writeFileSync(out+'/plan.json',JSON.stringify(plan,null,2)+'\n');
fs.writeFileSync(out+'/prepared.json',JSON.stringify({sourceHash:sourcePrepared.sourceHash,diagnosticOnly:true,runtimeWritten:false,cases:plan,limits:['Prototype vendor property only; no production fix is assumed.','Word Range evidence includes every word and line-top clustering, not merely raw rectangle count.','The 관심종자 case applies the property through diagnostic DOM after the real info click, not through product CSS.']},null,2)+'\n');
console.log(JSON.stringify({out,cases:plan.length,sourceHash:sourcePrepared.sourceHash,preparedOnly:true}));
