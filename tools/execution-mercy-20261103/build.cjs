'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),core=require('../text-workshop/core.cjs');
const {body,executionBlock,executions}=require('./sections.cjs');
function build(raw){
 const beforeSha256=core.hash(raw);assert.equal(beforeSha256,'d169c09f071f4a0944b33af4aaf49705ef1320365d6e255ede5b1f62419657da');
 const doc=core.parse(raw),old=executionBlock(doc),anchor="\tdynamic $clear_slave_instance, 'slave'\r\n";assert.equal(old.split(anchor).length-1,1);assert(!old.includes('jo9_cruel_mercy_apply'));
 const addition="\t! JO9 MOD START EXECUTION_CRUEL_MERCY_20261103\r\n\t! Half-point helper: -2 units = -1 point, only for a living or unconscious target reaching completion.\r\n\tif slave_state > CONST_INT['no_slave']: gs 'jo9_cruel_mercy_apply', -2\r\n\t! JO9 MOD END EXECUTION_CRUEL_MERCY_20261103\r\n";
 const next=old.replace(anchor,addition+anchor),loc=doc.locations.find(l=>l.name==='interaction_result'),originalBody=body(doc,'interaction_result');
 assert.equal(originalBody.split(old).length-1,1);doc.lines[loc.body]=core.shift(originalBody.replace(old,next),-5);
 const candidate=core.serialize(doc),after=core.parse(candidate),before=core.parse(raw);assert(core.serialize(after).equals(candidate));assert.equal(after.locations.length,before.locations.length);
 for(let i=0;i<doc.lines.length;i++)if(i!==loc.body)assert.equal(after.lines[i],before.lines[i]);
 assert.equal(body(after,'interaction_result').replace(addition,''),originalBody,'Only score hook added');
 const patch={id:'2026-11-03_execution_cruel_mercy',description:'User rule: completed executions -1 Cruel & Mercy; banishment excluded. Guard empty/dead target and resistance exit. Existing half-point helper unchanged.',before_sha256:beforeSha256,after_sha256:core.hash(candidate),edits:[{location:'interaction_result',field:'body',old,new:next,count:1}]};
 return {raw:candidate,patch,report:{beforeSha256,afterSha256:patch.after_sha256,changedLocations:['interaction_result'],locations:after.locations.length,executions,deltaPoints:-1,deltaInternalHalfUnits:-2,guard:'slave_state > CONST_INT[no_slave]',banishmentAndConfirmationUnchanged:true,allOtherFieldsPreserved:true,roundtrip:true}};
}
if(require.main===module){const[input,out]=process.argv.slice(2);assert(input&&out);const r=build(fs.readFileSync(input));fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'jack.qsp'),r.raw);fs.writeFileSync(path.join(out,'patch.json'),JSON.stringify(r.patch,null,2));fs.writeFileSync(path.join(out,'build.json'),JSON.stringify(r.report,null,2));console.log(JSON.stringify(r.report));}
module.exports={build};
