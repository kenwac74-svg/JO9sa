'use strict';
// Creates a reviewable candidate only. Never writes the input game or saves.
const fs=require('node:fs'),path=require('node:path');
const core=require('../text-workshop/core.cjs');
const BASELINE_SHA256='6cc7066736cae7fc428d58f89fbf659f06ee6feae8c710d810ee67c99467d505';
const ID='JSON_HISTORY_KO_DISPLAY_20261102';
function normalizeMap(input){
 const entries=Array.isArray(input)?input:input?.entries;
 if(!Array.isArray(entries)||!entries.length)throw Error('Expected nonempty entries array with exact old/new strings');
 const byOld=new Map();
 for(const e of entries){
  if(typeof e?.old!=='string'||typeof e?.new!=='string'||!e.old||!e.new)throw Error('Mapping old/new must be nonempty strings');
  if(/[\r\n\0]/.test(e.old+e.new))throw Error('Mapping must not contain a line break or NUL; use HTML for paragraphs');
  if(e.old===e.new)throw Error('Mapping must change its old string');
  if(byOld.has(e.old)&&byOld.get(e.old)!==e.new)throw Error('Conflicting translations for one exact old string');
  byOld.set(e.old,e.new);
 }
 return [...byOld].map(([old,value])=>({old,new:value}));
}
function qspText(text){
 if(typeof text!=='string'||/[\r\n\0]/.test(text))throw Error('QSP text must be a single line without NUL');
 // Each literal is formatted by QSP. Split << across operands to keep it literal.
 return text.split(/(?<=<)(?=<)/u).map(s=>"'"+s.replaceAll("'","''")+"'").join('+');
}
function helperBody(entries){
 return [
  '! JO9 MOD START '+ID,
  '! Exact display lookup only. Unlisted text and actor state remain unchanged.',
  '$result=$args[1]',
  "if $args[0] ! 'text': exit",
  ...entries.map(e=>'if $args[1]='+qspText(e.old)+': $result='+qspText(e.new)+' & exit'),
  '! JO9 MOD END '+ID
 ].join('\r\n');
}
function inspect(raw){
 const d=core.parse(raw),names=new Set();
 if(!core.serialize(d).equals(raw))throw Error('QSP byte roundtrip failed');
 for(const loc of d.locations){
  const name=loc.name.toLowerCase();
  if(!name||names.has(name))throw Error('Duplicate or empty QSP location: '+loc.name);
  names.add(name);
  const start=loc.body-2,acts=Number(core.shift(d.lines[start+3],5));
  const scripts=[core.shift(d.lines[loc.body],5)];
  for(let i=0;i<acts;i++)scripts.push(core.shift(d.lines[start+6+i*3],5));
  for(const text of scripts)if(/\r(?!\n)|(?<!\r)\n/.test(text))throw Error('Non-CRLF script in '+loc.name);
 }
 return d;
}
function build(raw,input,{expectedSha256}={}){
 if(expectedSha256&&core.hash(raw)!==expectedSha256.toLowerCase())throw Error('Baseline hash differs from the reviewed source');
 const entries=normalizeMap(input),doc=inspect(raw);
 if(doc.locations.some(l=>l.name.toLowerCase()==='jo9_json_ko'))throw Error('jo9_json_ko already exists; do not patch twice');
 const lines=doc.lines.slice(),edits=[];
 function replace(location,old,value){
  const loc=doc.locations.find(l=>l.name===location);
  if(!loc)throw Error('Missing location '+location);
  const text=core.shift(lines[loc.body],5);
  if(text.split(old).length-1!==1)throw Error('Expected one reviewed anchor in '+location);
  lines[loc.body]=core.shift(text.replace(old,value),-5);
  edits.push({location,field:'body',old,new:value,count:1});
 }
 replace('#dynamic',"$voice_native_stored = {\r\n $result=$args[1]", "$voice_native_stored = {\r\n $result=func('jo9_json_ko', 'text', $args[1])");
 replace('interaction',"or $voice_native_stored='' or $voice_native_moods=''", "or $voice_native_stored='' or instr($voice_native_stored,'jo9_json_ko')=0 or $voice_native_moods=''");
 replace('origins_relations',"$snk_origin_relation_body = '<br>' + $slave1['relative_relations']", "$snk_origin_relation_body = '<br>' + func('jo9_json_ko', 'text', $slave1['relative_relations'])");
 const added={name:'jo9_json_ko',desc:'',body:helperBody(entries),actions:[]};
 lines[3]=core.shift(String(doc.locations.length+1),-5);
 lines.splice(lines.length-1,0,...[added.name,added.desc,added.body,'0'].map(s=>core.shift(s,-5)));
 const output=core.serialize({lines}),checked=inspect(output);
 for(const loc of doc.locations){
  if(edits.some(e=>e.location===loc.name))continue;
  const other=checked.locations.find(l=>l.name===loc.name);
  const count=4+3*Number(core.shift(doc.lines[loc.body+1],5));
  if(doc.lines.slice(loc.body-2,loc.body-2+count).join('\r\n')!==checked.lines.slice(other.body-2,other.body-2+count).join('\r\n'))throw Error('Unrelated location changed: '+loc.name);
 }
 const patch={id:ID,before_sha256:core.hash(raw),after_sha256:core.hash(output),edits,add_locations:[added]};
 return {raw:output,patch,report:{schema:1,id:ID,before_sha256:patch.before_sha256,after_sha256:patch.after_sha256,mappings:entries.length,locations_before:doc.locations.length,locations_after:checked.locations.length,changed_locations:edits.map(e=>e.location),added_locations:[added.name],roundtrip:true,crlf:true,unrelated_locations_preserved:true,live_apply:false}};
}
function realPath(p){
 p=path.resolve(p);if(fs.existsSync(p))return fs.realpathSync(p);
 const parent=path.dirname(p);return parent===p?p:path.join(realPath(parent),path.basename(p));
}
function assertOutside(output,inputDir){
 const out=realPath(output).toLowerCase(),dir=realPath(inputDir).toLowerCase(),rel=path.relative(dir,out);
 if(!rel||rel==='.'||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))throw Error('Output must be outside the baseline game directory');
}
function main(argv){
 const args={};
 for(let i=0;i<argv.length;i+=2){const key=argv[i]?.replace(/^--/,'');if(!['baseline','map','out','expected-sha256'].includes(key)||!argv[i+1])throw Error('Expected --baseline FILE --map FILE --out NEW_DIRECTORY [--expected-sha256 SHA]');args[key]=argv[i+1];}
 if(!args.baseline||!args.map||!args.out)throw Error('Expected --baseline FILE --map FILE --out NEW_DIRECTORY');
 assertOutside(args.out,path.dirname(args.baseline));
 const names=['candidate.qsp','patch.json','report.json'];
 for(const name of names)if(fs.existsSync(path.join(args.out,name)))throw Error('Output already exists; choose a new directory: '+name);
 const raw=fs.readFileSync(args.baseline),input=JSON.parse(fs.readFileSync(args.map,'utf8').replace(/^\uFEFF/,''));
 const result=build(raw,input,{expectedSha256:args['expected-sha256']||BASELINE_SHA256});
 fs.mkdirSync(args.out,{recursive:true});
 fs.writeFileSync(path.join(args.out,'candidate.qsp'),result.raw);
 fs.writeFileSync(path.join(args.out,'patch.json'),JSON.stringify(result.patch,null,2)+'\n');
 fs.writeFileSync(path.join(args.out,'report.json'),JSON.stringify(result.report,null,2)+'\n');
 console.log(JSON.stringify({output:path.resolve(args.out),...result.report}));
}
if(require.main===module){try{main(process.argv.slice(2));}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={BASELINE_SHA256,ID,normalizeMap,qspText,helperBody,inspect,build,assertOutside};
