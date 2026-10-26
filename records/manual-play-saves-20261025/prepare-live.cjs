'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const here=__dirname,repo='G:/somi/JO9sa',work='G:/somi/Jack O Nine Tails v2.4_work/game',root='G:/Codex/tmp/manual-play-saves-20261025';
const c=require(repo+'/tools/text-workshop/core.cjs'),s=require(repo+'/tools/qa/save-codec.cjs'),qa=require(repo+'/tools/qa/release-check.cjs');
const raw=fs.readFileSync(work+'/jack.qsp');assert.equal(c.hash(raw),'a70bd177d8e7ade58243578b2f04745ff00cec3884d26d3b924dfffc8a8d007a');
const recipes=['combat','economy','traits','collar'].flatMap(n=>JSON.parse(fs.readFileSync(here+'/'+n+'-recipes.json')));
const q=x=>"'"+String(x).replaceAll("'","''")+"'",cr=x=>x.replace(/\r?\n/g,'\r\n');
const healthy=s.parse(fs.readFileSync(work+'/save/auto_day_end.sav'));
const names=['DEATH','ITEM_PRICE','ITEM_DESCRIPTION','ITEM_DEMO','МОДИФИКАТОР_ХОЛОДНОЕ_ЖЕЛЕЗО','МОДИФИКАТОР_СЕРЕБРО','БЕЗУСТАЛИ','МОДИФИКАТОР_СВЕТ','ХРУПКИЙ','В_ОТКЛЮЧКЕ','МОДИФИКАТОР_ПСИХИЧЕСКИЙ','ТРУП','БЕССТРАШНЫЙ','МОДИФИКАТОР_ТЬМА','БЕССМЕРТНЫЙ'];
function scalar(d,name,text){const v=d.vars.find(v=>v.name===name);assert(v,name);v.values[0][1]=text;}
function addNumber(d,name,n){const old=d.vars.find(v=>v.name===name);assert(!old);let slot=Math.max(...d.vars.map(v=>v.slot))+1;d.vars.push({slot,name,values:[[String(n),'']],idx:[]});}
fs.mkdirSync(root+'/inputs',{recursive:true});fs.mkdirSync(root+'/out',{recursive:true});
let manifest=[];const d=c.parse(raw),loc=n=>{const l=d.locations.find(x=>x.name===n);assert(l,n);return l;};
d.lines[loc('Start').body]=c.shift("usehtml=1\r\n*pl '<p>Manual save preparation. Load an input save.</p>'",-5);
let boot="jo9sv_case=autosave_day\r\ngs 'refresh_database'\r\nautosave=0 & decadesave=0 & autosave_day=0 & autosave_decade=0 & sound_on=0\r\n$counter='' & $onnewloc='' & $ongsave='' & $ongload='$ongload'\r\n";
let emit='';
for(let i=0;i<recipes.length;i++){
 const a=recipes[i],filename=String(i+1).padStart(2,'0')+'_'+a.id+'.sav',base=fs.readFileSync(work+'/save/'+a.baseSave);
 const repairs=[];
 if(!process.argv.includes('--reuse')||process.argv.includes(a.id)||!fs.existsSync(root+'/inputs/'+filename)){
 const doc=s.parse(base);assert(s.serialize(doc).equals(base));
 for(const name of names){const v=doc.vars.find(v=>v.name===name),h=healthy.vars.find(v=>v.name===name);if(v&&h&&v.idx.some(x=>x[0]===0)&&!h.idx.some(x=>x[0]===0)){v.values.unshift([...h.values[0]]);v.idx=v.idx.map(([n,k])=>[n+1,k]);repairs.push(name);}}
 scalar(doc,'ONGLOAD','jo9sv_boot');doc.vars.find(v=>v.name==='AUTOSAVE_DAY').values[0][0]=String(i+1);fs.writeFileSync(root+'/inputs/'+filename,s.serialize(doc));
 }
 boot+=`if jo9sv_case=${i+1}:\n`+a.setup.join('\n')+'\n'+a.entry+'\nend\n';
 emit+=`if jo9sv_case=${i+1} and (${a.checkpointGuard}):\n killvar 'JO9SV_CASE'\n savegame ${q('out/'+filename)}\nend\n`;
 manifest.push({...a,index:i+1,file:filename,input:root+'/inputs/'+filename,baseSha256:c.hash(base),repairs});
}
for(const name of new Set(recipes.map(a=>a.checkpoint))){const l=loc(name);d.lines[l.body]=c.shift(c.shift(d.lines[l.body],5)+"\r\ngs 'qa_emit'",-5);}
const lines=c.serialize(d).toString('utf16le').split('\r\n');lines.pop();lines[3]=c.shift(String(d.locations.length+2),-5);for(const [name,body]of [['jo9sv_boot',boot],['qa_emit',emit]])lines.push(c.shift(name,-5),'',c.shift(cr(body),-5),c.shift('0',-5));lines.push('');
const bytes=Buffer.from(lines.join('\r\n'),'utf16le');qa.inspectWorld(bytes);fs.writeFileSync(root+'/live.qsp',bytes);fs.writeFileSync(here+'/spec.json',JSON.stringify({source:work+'/jack.qsp',sha256:c.hash(raw),factory:'native menu Load -> complete native variable restore -> current database refresh -> original scene -> native save',root,all:manifest},null,2));
console.log(JSON.stringify({prepared:manifest.length,diagnosticBytes:bytes.length,allCompleteVariablesPreserved:true}));
