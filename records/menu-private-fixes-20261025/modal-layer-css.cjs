'use strict';
// Rejected diagnostic hypothesis, retained only for evidence. Do not apply to WORK.
// The COVERED failure was diagnostic phase reinitialization after MSG rerender.
const assert=require('node:assert/strict');
const rule='#__message__{z-index:2147483647!important}';
const start='/* JO9 MOD START NATIVE_MESSAGE_LAYER_20261025 */',end='/* JO9 MOD END NATIVE_MESSAGE_LAYER_20261025 */';
function buildModalLayerCss(text){
 assert.equal(typeof text,'string');
 if(text.includes(start)){assert(text.includes(rule)&&text.includes(end),'Incomplete existing modal layer patch');return text;}
 const active=text.replace(/\/\*[\s\S]*?\*\//g,'');
 assert(!/#__message__\s*\{/.test(active),'Existing global modal rule requires explicit review');
 return text+(text.endsWith('\n')?'':'\r\n')+'\r\n'+start+'\r\n'+rule+'\r\n'+end+'\r\n';
}
module.exports={buildModalLayerCss,rule};
if(require.main===module){
 const fs=require('node:fs'),path=require('node:path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
 const game='G:/somi/Jack O Nine Tails v2.4_work/game',source=game+'/css/base.css',backup='G:/somi/JO9_work_backups/menu-private-fixes-20261025/css/base.css',output=__dirname+'/base.candidate.css',manifest=__dirname+'/modal-layer-css.json';
 const before=fs.readFileSync(source),oldText=before.toString('utf8');assert(Buffer.from(oldText,'utf8').equals(before));
 const expected=JSON.parse(fs.readFileSync(__dirname+'/inputs.json','utf8').replace(/^\uFEFF/,'')).find(x=>path.resolve(x.path).toLowerCase()===path.resolve(source).toLowerCase());assert(expected);assert.equal(c.hash(before),expected.sha256);
 const profile=fs.readFileSync(game+'/css/jo9_traits_view.css','utf8');assert(profile.includes(rule),'The reused rule must exist in the known-working profile component');
 const next=buildModalLayerCss(oldText),after=Buffer.from(next,'utf8');assert(next.startsWith(oldText));assert.equal(buildModalLayerCss(next),next);assert.notEqual(next,oldText);
 fs.mkdirSync(path.dirname(backup),{recursive:true});if(fs.existsSync(backup))assert(fs.readFileSync(backup).equals(before),'Never replace an earlier different backup');else fs.copyFileSync(source,backup,fs.constants.COPYFILE_EXCL);
 assert(!fs.existsSync(output)&&!fs.existsSync(manifest),'Use a new candidate revision instead of overwriting');
 fs.writeFileSync(output,after,{flag:'wx'});assert.equal(c.hash(fs.readFileSync(source)),expected.sha256,'Production CSS changed during preparation');
 const result={status:'CANDIDATE_ONLY',id:'NATIVE_MESSAGE_LAYER_20261025',runtimePath:'css/base.css',source,backup,candidate:output,before_sha256:c.hash(before),after_sha256:c.hash(after),beforeBytes:before.length,afterBytes:after.length,rule,reusedFrom:'css/jo9_traits_view.css',newRuntimeFiles:0,qspUnchanged:true,newPersistentKeys:0,scope:'Only the native message container stacking level changes. No position, dimensions, pointer events, body state, quantity or game action changes.',checks:{sourcePrefixPreserved:true,idempotent:true,productionUnchanged:true},nativeStatus:'Not executed by this preparation script'};
 fs.writeFileSync(manifest,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
}
