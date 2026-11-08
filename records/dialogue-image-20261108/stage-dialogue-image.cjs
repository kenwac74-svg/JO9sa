const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict'),vm=require('node:vm'),zlib=require('node:zlib'),crypto=require('node:crypto');
const repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',src=repo+'/tools/text-workshop',installed=work+'/modtools/text-workshop',tmp='G:/Codex/tmp/dialogue-image-20261108',record=repo+'/records/dialogue-image-20261108';
fs.mkdirSync(tmp,{recursive:true});fs.mkdirSync(record+'/before',{recursive:true});const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const names=['index.html','server.cjs','flow.cjs'],before={};for(const n of names)for(const root of [src,installed]){const p=root+'/'+n;before[p]=hash(p);fs.writeFileSync(record+'/before/'+before[p]+'.gz',zlib.gzipSync(fs.readFileSync(p)));a.equal(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n'),fs.readFileSync(src+'/'+n,'utf8').replaceAll('\r\n','\n'),'WORK/source drift '+n);}
for(const p of [work+'/jack.qsp',work+'/modtools/catalog/catalog_status.js'])before[p]=hash(p);
for(const entry of fs.readdirSync(src,{withFileTypes:true}))if(entry.isFile()&&/\.(cjs|js|html|css)$/.test(entry.name))fs.copyFileSync(src+'/'+entry.name,tmp+'/'+entry.name);
let html=fs.readFileSync(tmp+'/index.html','utf8'),server=fs.readFileSync(tmp+'/server.cjs','utf8'),flow=fs.readFileSync(tmp+'/flow.cjs','utf8');
function replace(s,old,next){a.equal(s.split(old).length,2,'unique hook '+old.slice(0,60));return s.replace(old,next);}
const markup=`<section id="dialogueImagePanel" hidden><h2>선택 대사에 이미지 연결</h2><p id="dialogueImageTarget" class="path"></p><div class="row"><button id="dialogueImageChoose" type="button">기존 이미지 선택</button><button id="dialogueImageImport" type="button">새 이미지 등록</button></div><p id="dialogueImagePath" class="path">연결할 이미지를 선택하세요.</p><div class="row"><button id="dialogueImagePreview" type="button">장면 미리보기</button><button id="dialogueImageApply" type="button" disabled>이미지 연결 반영</button></div><p id="dialogueImageStatus" class="muted" role="status"></p><section id="dialogueImagePreviewBox" hidden><p id="dialogueImageScope" class="path"></p><div class="game"><div class="shots"><img id="dialogueImagePreviewImg" alt="연결할 장면 이미지"></div><p id="dialogueImagePreviewText" style="white-space:pre-wrap"></p></div></section></section>
<dialog id="dialogueImagePicker" aria-label="장면 이미지 파일 선택"><h2>장면 이미지 선택</h2><p id="dialogueImageFolder" class="path"></p><div class="row"><button id="dialogueImageUp" type="button">상위 폴더</button><button id="dialogueImagePickerClose" type="button">취소</button></div><div id="dialogueImageFiles" class="dialogue-image-files"></div><div class="row"><button id="dialogueImagePrev" type="button">이전 목록</button><span id="dialogueImagePage"></span><button id="dialogueImageNext" type="button">다음 목록</button></div></dialog>`;
html=replace(html,'<div id="incoming" hidden>',markup+'\n<div id="incoming" hidden>');html=replace(html,'<script src="dialogue-ai.js"></script>','<script src="dialogue-ai.js"></script>\n<script src="dialogue-image-ui.js"></script>');
flow=replace(flow,"if(!b||b.array!=='$special_image'||b.stage!==bind.stage", "if(!b||!['$special_image','$special_image_full'].includes(b.array)||b.stage!==bind.stage");
flow=replace(flow,'images.push({path:e.text,note:conditions',"images[b.array==='$special_image_full'?'unshift':'push']({path:e.text,note:conditions");
server=replace(server,"const addition=require('./addition.cjs');","const addition=require('./addition.cjs');\nconst dialogueImage=require('./dialogue-image.cjs'); // JO9 MOD DIALOGUE_IMAGE_BINDING_20261108");
server=replace(server,"'/script-range.js'].includes", "'/script-range.js','/dialogue-image-ui.js'].includes");
const rootStart=server.indexOf("if(req.method==='GET' && url.pathname==='/')"),rootEnd=server.indexOf("if(req.method==='GET'&&url.pathname==='/workshop.css')",rootStart);a(rootStart>0&&rootEnd>rootStart);const rootRoute=server.slice(rootStart,rootEnd);server=server.slice(0,rootStart)+replace(rootRoute,"connect-src 'self'; frame-ancestors", "connect-src 'self'; img-src 'self' blob: data:; worker-src 'self' blob:; frame-ancestors")+server.slice(rootEnd);
server=replace(server,"    if(req.method==='POST' && url.pathname==='/api/preview'){",`    // JO9 MOD START DIALOGUE_IMAGE_BINDING_20261108-preview
    if(req.method==='POST'&&url.pathname==='/api/dialogue-image/preview'){
      const input=await body(req),rel=dialogueImage.imagePath(input.path),image=resolvePic(rel);if(!image)throw Error('연결할 이미지 파일이 PIC 폴더에 없습니다. 먼저 이미지를 등록하세요.');
      const {doc}=current(),p=dialogueImage.prepare(doc,input.selection,image.rel,input);preview={...p,kind:'image',id:crypto.randomBytes(24).toString('hex')};
      json(res,200,{id:preview.id,location:p.targetLocation,title:p.usage.title,page:p.page,path:p.path,dialogue:p.entry.text,variants:p.variants,sceneId:p.sceneId,usageId:p.usage.id,imageUrl:'/api/pic?t='+token+'&p='+encodeURIComponent(p.path)+'&v='+fs.statSync(image.full).mtimeMs});return;
    }
    // JO9 MOD END DIALOGUE_IMAGE_BINDING_20261108-preview
    if(req.method==='POST' && url.pathname==='/api/preview'){
`);
server=replace(server,"      // JO9 MOD START: text-batch-replace-20261018-apply",`      // JO9 MOD START DIALOGUE_IMAGE_BINDING_20261108-apply
      if(p.kind==='image'){
        const stamp=new Date().toISOString(),mod={description:'대사 편집실: '+p.targetLocation+' '+p.page+'단계 이미지 연결',id:stamp.slice(0,10)+'_dialogue_image_'+stamp.slice(11,19).replace(/:/g,''),target:'game\\\\jack.qsp',before_sha256:p.before.toUpperCase(),after_sha256:p.after.toUpperCase(),edits:[{location:p.targetLocation,field:'body',old:p.piece.old,new:p.piece.new,count:1}]};
        if(!resolvePic(p.path))throw Error('미리보기 이후 이미지 파일이 없어졌습니다. 다시 선택하세요.');
        const result=transact(raw,p.raw,{kind:'image',location:p.targetLocation,field:'body',page:p.page,image:p.path,mod});current();
        const selected=cacheEntries.find(e=>e.fieldIndex===p.entry.fieldIndex&&e.start===p.entry.start&&e.text===p.entry.text);json(res,200,{...result,selection:selected?{...selected,hash:cache.hash}:null});return;
      }
      // JO9 MOD END DIALOGUE_IMAGE_BINDING_20261108-apply
      // JO9 MOD START: text-batch-replace-20261018-apply`);
for(const [name,data]of [['index.html',html],['server.cjs',server],['flow.cjs',flow]])fs.writeFileSync(tmp+'/'+name,data);
for(const n of ['dialogue-image.cjs','dialogue-image-ui.js','dialogue-image.test.cjs'])fs.copyFileSync(n,tmp+'/'+n);
fs.appendFileSync(tmp+'/workshop.css','\n/* JO9 MOD DIALOGUE_IMAGE_UI_20261108 */\n#dialogueImagePicker{color:inherit;background:var(--panel,#172335);border:1px solid #64748b;border-radius:8px;width:min(850px,94vw);max-height:88vh}#dialogueImagePicker::backdrop{background:#000a}.dialogue-image-files{display:flex;flex-direction:column;gap:4px;max-height:55vh;overflow:auto;margin:12px 0}.dialogue-image-files button{text-align:left;overflow-wrap:anywhere}#dialogueImageTarget,#dialogueImageScope{white-space:pre-wrap;overflow-wrap:anywhere}\n');
for(const root of [src,installed]){before[root+'/workshop.css']=hash(root+'/workshop.css');fs.writeFileSync(record+'/before/'+before[root+'/workshop.css']+'.gz',zlib.gzipSync(fs.readFileSync(root+'/workshop.css')));}
for(const n of ['server.cjs','flow.cjs','dialogue-image-ui.js'])new vm.Script(fs.readFileSync(tmp+'/'+n,'utf8'));for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
fs.writeFileSync(record+'/plan.json',JSON.stringify({tmp,src,installed,before,names:[...names,'workshop.css','dialogue-image.cjs','dialogue-image-ui.js']},null,2));console.log(JSON.stringify({tmp,record}));
