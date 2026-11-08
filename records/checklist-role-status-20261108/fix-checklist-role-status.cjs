const fs=require('node:fs'),crypto=require('node:crypto'),zlib=require('node:zlib'),path=require('node:path'),core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const repo='G:/somi/JO9sa',root=repo+'/tools/girls-image-checklist',game='G:/somi/Jack O Nine Tails v2.4_work/game',record=repo+'/records/checklist-role-status-20261108',tmp='G:/Codex/tmp/checklist-role-status-20261108';
fs.mkdirSync(record+'/before',{recursive:true});fs.mkdirSync(tmp,{recursive:true});
const doc=core.parse(fs.readFileSync(game+'/jack.qsp')),body=n=>core.shift(doc.lines[doc.locations.find(l=>l.name===n).body],5);
for(const [old,pack]of [['fullmade','indpack_maid'],['fullsecretary','indpack_secr'],['fullmistress','indpack_dom']])if(!body('assistant_stat').includes("func('jo9_seed_role_images','registered',assistant_type,'"+old+"','"+pack+"')"))throw Error('Current runtime menu policy differs');
if(!body('jo9_seed_role_images').includes("if $jo9_lookup_old ! '' or $jo9_lookup_pack ! '': result=1"))throw Error('Runtime dual registration not confirmed');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const htmls=[repo+'/tools/local-workspace/catalog-seed/catalog_merge_vs_original.html',game+'/modtools/catalog/catalog_merge_vs_original.html',game+'/modtools/catalog/JO9_캐릭터_이미지체크리스트.html'];
const targets=[root+'/catalog-girls-checklist.js',root+'/build_inventory.py',root+'/manifest.json',...htmls],before={};
for(const p of [...targets,game+'/jack.qsp',game+'/json/slaves/1031.json',game+'/modtools/catalog/catalog_status.js']){before[p]=hash(p);if(!p.endsWith('jack.qsp'))fs.writeFileSync(record+'/before/'+before[p]+'.gz',zlib.gzipSync(fs.readFileSync(p)));}
fs.writeFileSync(record+'/before.json',JSON.stringify(before,null,2));
function ui(code){
 const old="    else if (!legacy && pack) { state = 'hidden'; text = '그림 있음 · 복장 선택 연결 필요'; }\n";if(!code.includes(old))throw Error('Role classification baseline mismatch');code=code.replace(old,'');
 code=code.replace("    if (moodMissing) text +=", "    if (state === 'ok' && !legacy && pack) text = '전용 그림 있음 · 추가팩 등록';\n    if (moodMissing) text +=");
 const start=code.indexOf("      const old=node('details');old.append(node('summary','이전 개별 장면 등록 · 현재 행동 화면과 연결 확인 필요'));");
 const end=code.indexOf("      if((c.namedSceneAssets||[]).length)",start);if(start<0||end<0)throw Error('Legacy block baseline mismatch');
 code=code.slice(0,start)+`      const legacyFields=(c.legacyFields||[]).filter(key=>c.refs[key]);
      if(legacyFields.length){
        const old=node('details');old.append(node('summary','이전 개별 장면 등록 · 참고 경로'));
        const legacy=node('div',undefined,'gc-list');
        for(const key of legacyFields)legacy.append(pathRow(c.refs[key],key));
        old.append(node('p','옛 개별 등록은 번호별 행동 컷과 별도 자료입니다. 이 목록만으로 현재 장면의 미연결 여부를 판정하지 않습니다.','gc-note'),legacy);card.append(old);
      }
`+code.slice(end);return code;
}
let changedRoles=0;
function data(value){for(const c of value.characters){for(const role of Object.values(c.effectiveRoles||{})){const available=!!(c.refs[role.legacyField]||c.refs[role.packField]);if(available!==role.menuAvailable||role.menuIssue)changedRoles++;role.menuAvailable=available;role.menuIssue=false;}}return value;}
const staged=[];function put(p,t){const file=tmp+'/'+staged.length+'-'+path.basename(p);fs.writeFileSync(file,t);staged.push({path:p,file,hash:hash(file)});}
put(root+'/catalog-girls-checklist.js',ui(fs.readFileSync(root+'/catalog-girls-checklist.js','utf8')));
let py=fs.readFileSync(root+'/build_inventory.py','utf8');py=py.replace('"menuAvailable": bool(refs.get(legacy)),','"menuAvailable": bool(refs.get(legacy) or refs.get(pack)),');
const oldPy='"menuIssue": not refs.get(legacy) and bool(refs.get(pack))\n                         and refs[pack].lower() in known_files,';if(!py.includes(oldPy))throw Error('Inventory policy baseline mismatch');py=py.replace(oldPy,'# Current WORK enables the role when either registration is present.\n            "menuIssue": False,');put(root+'/build_inventory.py',py);
put(root+'/manifest.json',JSON.stringify(data(JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'))))+'\n');
for(const p of htmls){let html=fs.readFileSync(p,'utf8');
 const marker='/* JO9 MOD START GIRLS_CHARACTER_CHECKLIST_20261104 */',tail='/* JO9 MOD END GIRLS_CHARACTER_CHECKLIST_20261104 */',start=html.indexOf(marker),end=html.indexOf(tail,start)+tail.length;if(start<0||end<tail.length)throw Error('UI module not found '+p);
 html=html.slice(0,start)+ui(html.slice(start,end))+html.slice(end);
 const re=/(window\.JO9_GIRLS_CHECKLIST\s*=\s*)([\s\S]*?)(;\s*<\/script\s*>)/i,m=html.match(re);if(!m)throw Error('Character data not found '+p);
 html=html.replace(re,(_,a,json,b)=>a+JSON.stringify(data(JSON.parse(json))).replaceAll('<','\\u003c')+b);put(p,html);
}
fs.writeFileSync(tmp+'/plan.json',JSON.stringify({before,staged,changedRoleRecords:changedRoles,verifiedRuntimeHash:doc.hash},null,2));
// Unit tests use the same candidates, without touching runtime assets.
fs.copyFileSync(staged[0].file,tmp+'/catalog-girls-checklist.js');fs.copyFileSync(staged[2].file,tmp+'/manifest.json');
console.log(JSON.stringify({files:staged.length,changedRoleRecords:changedRoles,verifiedRuntimeHash:doc.hash}));
