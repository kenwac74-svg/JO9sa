const fs=require('node:fs'),zlib=require('node:zlib'),crypto=require('node:crypto');
const root='G:/somi/JO9sa/tools/text-workshop',work='G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop',record='G:/somi/JO9sa/records/script-inline-edit-20261108',tmp='G:/Codex/tmp/script-inline-edit-20261108';
const names=['script-review.js','script-import-ui.js','workshop.css','index.html'],hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
fs.mkdirSync(record+'/before',{recursive:true});fs.mkdirSync(tmp,{recursive:true});const before={};for(const dir of [root,work])for(const n of names){const p=dir+'/'+n;before[p]=hash(p);fs.writeFileSync(record+'/before/'+before[p]+'.gz',zlib.gzipSync(fs.readFileSync(p)));}
for(const p of ['G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp','G:/somi/Jack O Nine Tails v2.4_work/game/modtools/catalog/catalog_status.js'])before[p]=hash(p);
fs.writeFileSync(record+'/before.json',JSON.stringify(before,null,2));
let helper=fs.readFileSync(root+'/script-review.js','utf8');const at=helper.indexOf(' function draw(');if(at<0)throw Error('Missing helper baseline');
const fn=String.raw` function replaceBlock(text,id,replacement){
  text=String(text);replacement=String(replacement);
  const normalized=line=>line.replace(/^\\(?=(?:={2,}|-{2,})\s*\[S\d+)/,'').replace(/\\$/,'');
  const mark=line=>line.match(/^-{2,}\s*\[(S\d+-P\d+)\]/)||line.match(/^\(\s*(S\d+-P\d+-V\d+)\b[^)]*\)\s*대체문/)||line.match(/^\[(S\d+-L\d+)\b[^\]]*\]\s*$/);
  const structure=line=>/^(?:={2,}\s*\[S\d+\]|\[대사 묶음[\s\]]|▶ |\s+\d+\)\s|\s+·\s|#|\[실행 중 결정|\(진입 조건:|\(이 장면에는|\(이 배열의|`+'`'+'`'+'`'+String.raw`)/.test(line);
  if(replacement.split(/\r\n?|\n/).some(line=>mark(normalized(line))||structure(normalized(line))||/^\(조건:.*\)$/.test(line.trim())))throw Error('대사 본문에 페이지 구분선이나 메타데이터를 넣을 수 없습니다.');
  const ranges=[];let current=null,bodyStart=null,bodyEnd=null,insert=0,afterPage=false;
  const flush=()=>{if(current===id)ranges.push({start:bodyStart??insert,end:bodyEnd??insert,empty:bodyStart===null});current=null;};
  const rows=/[^\r\n]*(?:\r\n|\r|\n|$)/g;let row;
  while((row=rows.exec(text))&&row[0]){
   const raw=row[0].replace(/(?:\r\n|\r|\n)$/,''),line=normalized(raw.replace(/\s+$/,'')),m=mark(line);
   if(m){flush();current=m[1];bodyStart=bodyEnd=null;insert=rows.lastIndex;afterPage=/^-/.test(line);continue;}
   if(structure(line)){flush();continue;}
   if(!current)continue;
   if(afterPage&&bodyStart===null&&/^\(조건:.*\)$/.test(line.trim())){insert=rows.lastIndex;continue;}
   if(line.trim()){if(bodyStart===null)bodyStart=row.index;bodyEnd=row.index+raw.length;afterPage=false;}
  }
  flush();if(ranges.length!==1)throw Error(ranges.length?'같은 페이지 번호가 중복되었습니다.':'수정할 페이지 번호를 찾지 못했습니다.');
  const r=ranges[0],eol=(text.match(/\r\n|\r|\n/)||['\n'])[0],body=replacement.replace(/\r\n?|\n/g,eol);
  return text.slice(0,r.start)+body+(r.empty&&body?eol:'')+text.slice(r.end);
 }
`;
helper=helper.slice(0,at)+fn+helper.slice(at);helper=helper.replace('return {dimensions,overflow,displayText,createGate,draw};','return {dimensions,overflow,displayText,createGate,draw,replaceBlock};');fs.writeFileSync(tmp+'/script-review.js',helper);
let ui=fs.readFileSync(root+'/script-import-ui.js','utf8');ui=ui.replace("pendingLayout=null;\n const inputs", "pendingLayout=null;const inlineErrors=new Set();\n const inputs");
ui=ui.replace('function clear(note){','function clear(note,keepCards=false){');ui=ui.replace("$('scriptChanges').replaceChildren();$('scriptLayoutResults').replaceChildren();if(note", "if(!keepCards){inlineErrors.clear();$('scriptChanges').replaceChildren();}$('scriptLayoutResults').replaceChildren();if(note");
ui=ui.replace("if(!keepCards){inlineErrors.clear();", "if(!keepCards){$('scriptPreview').disabled=busy;inlineErrors.clear();");
const beforeRender=ui.indexOf(' function render(r){');
ui=ui.slice(0,beforeRender)+` function inlineChanged(id,editor){
  if(busy)return;let note=id+' 수정문을 전체 각본에 반영했습니다. 구문·화면 검토를 다시 누르세요.';
  try{$('scriptAdapted').value=ui.replaceBlock($('scriptAdapted').value,id,editor.value);inlineErrors.delete(id);persist();}
  catch(e){inlineErrors.add(id);note=id+' 편집 오류: '+e.message+' 이 입력칸을 바로잡아 주세요.';}
  clear(note,true);$('scriptPreview').disabled=inlineErrors.size>0;
 }
`+ui.slice(beforeRender);
const old="const cols=node('div',undefined,'cols');cols.append(node('div',c.oldPlain,'old'),node('div',c.newPlain));card.append(cols);list.append(card);";
if(!ui.includes(old))throw Error('Missing comparison baseline');
ui=ui.replace(old,`const cols=node('div',undefined,'cols'),editLabel=node('label','수정문 · 직접 편집'),edit=node('textarea',undefined,'scriptPageEditor');
   edit.value=c.newPlain;edit.rows=3;edit.spellcheck=false;edit.setAttribute('aria-label',c.id+' 수정문');edit.dataset.pageId=c.id;edit.oninput=()=>inlineChanged(c.id,edit);editLabel.append(edit);
   cols.append(node('div',c.oldPlain,'old'),editLabel);card.append(cols);list.append(card);`);
ui=ui.replace('if(busy)return;if(resetExclusions)',"if(busy)return;if(inlineErrors.size){$('scriptImportStatus').textContent='편집 오류가 있는 페이지를 먼저 바로잡아 주세요.';return;}if(resetExclusions)");
ui=ui.replace("$('scriptPreview').onclick=()=>preview(true);", "$('scriptPreview').onclick=()=>preview(false);");
ui=ui.replace('excluded.add(c.id);preview(false);','excluded.add(c.id);return preview(false);');
ui=ui.replace("querySelectorAll('input')", "querySelectorAll('input,textarea')");
fs.writeFileSync(tmp+'/script-import-ui.js',ui);
let css=fs.readFileSync(root+'/workshop.css','utf8');css+='\n/* JO9 MOD SCRIPT_INLINE_EDIT_20261108 */\n#scriptImport .scriptPageEditor{width:100%;min-height:90px;resize:vertical;white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;color:#f3f4f6}#scriptImport .cols>label{min-width:0;font-size:13px;color:#b9c3d5}\n';fs.writeFileSync(tmp+'/workshop.css',css);
let html=fs.readFileSync(root+'/index.html','utf8');html=html.replace('수정본을 아래에 붙여 넣거나 TXT를 여세요. 원본 각본 ID로 대사를 연결하고 변경 내용·구문·화면 분량을 검토한 뒤 WORK에 반영합니다.','수정본을 아래에 붙여 넣거나 TXT를 여세요. 검토 결과 오른쪽 수정문도 직접 편집할 수 있습니다. 카드에서 고친 내용은 전체 각본에 동기화되며, 다시 구문·화면 검토 후 WORK에 반영합니다.');fs.writeFileSync(tmp+'/index.html',html);
fs.copyFileSync(process.cwd()+'/inline-script-edit.test.cjs',tmp+'/inline-script-edit.test.cjs');console.log('Prepared inline editing candidates.');
