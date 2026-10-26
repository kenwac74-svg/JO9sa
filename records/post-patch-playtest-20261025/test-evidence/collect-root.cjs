'use strict';
const k=require('./root-kit.cjs'),{fs,path,root,sc,c}=k;const out=path.resolve(__dirname,'root-evidence');fs.mkdirSync(out,{recursive:true});
for(const dir of ['milk-native','roles-native','assets-native','occupied-native','quick-native']){
 const to=out+'/'+dir;fs.mkdirSync(to,{recursive:true});
 for(const n of fs.readdirSync(root+'/'+dir))if(/(?:result\.json|plan\.json|stderr\.log|stdout\.log)$/.test(n))fs.copyFileSync(root+'/'+dir+'/'+n,to+'/'+n);
}
const ar=JSON.parse(fs.readFileSync(root+'/assets-native/result.json'));
const signature=s=>c.hash(Buffer.from(JSON.stringify(s.vars.filter(v=>/QUEST|FAME|REPUTATION|CONTRACT|ORDER|NPC_PROGRESS|PERSONAL_RELATIONS/.test(v.name)&&!['FAME_DISLIKE','FAME_NEED'].includes(v.name)))));
const start=sc.parse(fs.readFileSync(root+'/assets-native/asset-start.sav')),end=sc.parse(fs.readFileSync(root+'/assets-native/asset-ending.sav'));
ar.questBefore=signature(start);ar.questAfter=signature(end);ar.questUnchanged=ar.questBefore===ar.questAfter;ar.questSignatureExcludes=['FAME_DISLIKE','FAME_NEED'];
ar.exclusionReason='The two generated spoken-text caches replace the sold actor name Egeya with an empty name after the role is cleared; they are not NPC quest/progress/reputation state.';
if(!ar.questUnchanged)throw Error('NPC/quest state mismatch');fs.writeFileSync(out+'/assets-native/result.json',JSON.stringify(ar,null,2));
const official=fs.readdirSync(root+'/official').filter(n=>n.startsWith('run-')).sort().at(-1),of=root+'/official/'+official;fs.mkdirSync(out+'/official',{recursive:true});
for(const n of ['report.json','report.md','client-runner.log','patch-replay.log','patch-reapply.log'])if(fs.existsSync(of+'/'+n))fs.copyFileSync(of+'/'+n,out+'/official/'+n);
const gui={sourceQspSha256:c.hash(fs.readFileSync(root+'/gui/jack.qsp')),engine:k.game+'/engine/jack.exe',originalGameQspUnmodified:true,resourceJunctionsReadOnly:true,saveLoading:'Physical Windows Game->Load (Ctrl+L) using original WORK paths. ignoreCRC=true only in task-local FastQSP.ini. Strict CRC compatibility not tested.',observations:[
 {feature:'F06',steps:['Load original04','Click original license menu','Click original Y'],result:'Native current milk panel is at right lower side and face remains uncovered. Sparks20000->19800. Numeric legibility was resolved by separate fresh native DOM1..7 runs, rather than assumed from this screenshot.',evidence:['../gui-evidence/04-milk-loaded.jpg','../gui-evidence/04-milk-license.jpg','../gui-evidence/04-milk-licensed.jpg']},
 {feature:'F09',steps:['Load original06_ISABELLA.sav','Observe current Isabella full image and warning','Physical click original forward'],result:'Main menu and visible room background restored; no blank/brown canvas.',evidence:['../gui-evidence/06-isabella-loaded.jpg','../gui-evidence/06-isabella-forward.jpg']},
 {feature:'F10',steps:['Load original08_SETTLE.sav','Click original decoration disposal','Observe basic interior and360','Save through Ctrl+S to own08-settled-current.sav','Load same task-local save through Ctrl+L'],result:'Refund460 minus single bill100 yields360; after reload money360/day102 persists. Parsed snapshot confirms jo9_lq.active0 and study basic.',snapshot:{sha256:c.hash(fs.readFileSync(root+'/gui/save/08-settled-current.sav')),money:360,day:102,active:0,study:'basic',estate:'white_house'}},
 {feature:'F32',steps:['Click original master portrait from main','Observe native inventory profile'],result:'Manual title edits render without old letter prefixes; question icon present. A physical question click had no definite observed outcome, so it is not credited as a modal test. Native automated follow-up is recorded by traits worker.'},
 {feature:'F01',steps:['view_image current color PNG','view_image current sepia PNG'],result:'Both150x150 assets inspected. Sepia image is visibly tinted and preserves face/border. An actual in-game character-selection transition was not run.'}
],notProductDefect:'One click aimed at the main C shortcut led to cryo storage; cause was not established. Evidence file was renamed from its initially misleading32-master-stat name to observed-cryo-after-shortcut-click.jpg. It is not used as proof of a broken master-profile route.'};
fs.writeFileSync(out+'/gui-ledger.json',JSON.stringify(gui,null,2));
console.log(JSON.stringify({rootEvidence:out,questStatePreserved:ar.questUnchanged,official:JSON.parse(fs.readFileSync(out+'/official/report.json')).verdict,guiCurrent:gui.sourceQspSha256}));
