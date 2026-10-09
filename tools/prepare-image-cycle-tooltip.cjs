'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const core=require('./cut-addition/core.cjs'),{checkSyntax}=require('./check-image-cycle-syntax.cjs');
const root=path.resolve(__dirname,'..'),game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game',out=path.join(root,'tmp/image-cycle-tooltip');
const raw=fs.readFileSync(path.join(game,'jack.qsp')),doc=core.parse(raw);
assert.ok(core.serialize(doc).equals(raw),'QSP roundtrip mismatch');
const loc=doc.locations.find(l=>l.name==='interior_change'),body=core.shift(doc.lines[loc.body],5);
const old='<a class="tooltip-bottom" tooltip-data="이미지 전환" title="이미지 전환" href="EXEC: gs',next='<a class="tooltip-right" tooltip-data="이미지 전환" title="이미지 전환" style="display:block;position:relative;width:26px;height:26px;" href="EXEC: gs';
assert.equal(body.split(old).length-1,1);
const changed=body.replace(old,next);assert.ok(checkSyntax(changed).ok,'QSP syntax validation failed');
doc.lines[loc.body]=core.shift(changed,-5);const after=core.serialize(doc),parsed=core.parse(after),before=core.parse(raw);
assert.ok(core.serialize(parsed).equals(after));assert.equal(parsed.lines.length,before.lines.length);
for(let i=0;i<parsed.lines.length;i++)if(i!==loc.body)assert.equal(parsed.lines[i],before.lines[i]);
const id='2026-10-08_image_cycle_tooltip_right',mod={id,description:'좌측 상단 이미지 전환 버튼의 툴팁을 오른쪽에 표시하고 기준 영역을 명시',before_sha256:core.hash(raw),after_sha256:core.hash(after),edits:[{location:'interior_change',field:'body',old,new:next,count:1}]};
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,id+'.json'),JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(path.join(root,'mods',id+'.json'),JSON.stringify(mod,null,2)+'\n');fs.writeFileSync(path.join(out,'candidate.qsp'),after);
const cssPath=path.join(game,'css/base.css'),cssBefore=fs.readFileSync(cssPath),css=cssBefore.toString('utf8'),marker='/* JO9 image-cycle tooltip: keep the label inside the left image edge. */';
assert.ok(!css.includes(marker),'Tooltip CSS already installed');
const rules=`\n${marker}
#jo9_image_cycle { overflow:visible !important; }
#jo9_image_cycle > a[tooltip-data]:after {
  top:0 !important; bottom:auto !important;
  left:calc(100% + 8px) !important; right:auto !important;
  margin:0 !important; min-width:0 !important; width:auto !important;
  padding:6px 10px !important; white-space:nowrap !important;
  line-height:26px !important; z-index:10000 !important;
}
`;
fs.writeFileSync(path.join(out,'tooltip.css'),rules);fs.writeFileSync(path.join(out,'base.css'),Buffer.concat([cssBefore,Buffer.from(rules)]));
fs.writeFileSync(path.join(out,'validation.json'),JSON.stringify({qspBefore:mod.before_sha256,qspAfter:mod.after_sha256,cssBefore:core.hash(cssBefore),cssAfter:core.hash(fs.readFileSync(path.join(out,'base.css'))),changedFields:1,syntax:'PASS',otherLocations:'unchanged'},null,2));
// Keep subsequent regeneration and the persistent source record consistent.
for(const p of [path.join(root,'tools/prepare-image-cycle.cjs'),path.join(root,'mods/2026-10-08_persistent_image_cycle.json')]){
 const s=fs.readFileSync(p,'utf8');if(p.endsWith('.cjs')){assert.ok(s.includes(old));fs.writeFileSync(p,s.replace(old,next));}
 else{const record=JSON.parse(s),edit=record.edits.find(e=>e.location==='interior_change');assert.ok(edit.new.includes(old));edit.new=edit.new.replace(old,next);record.after_sha256=mod.after_sha256;fs.writeFileSync(p,JSON.stringify(record,null,2)+'\n');}
}
console.log(fs.readFileSync(path.join(out,'validation.json'),'utf8'));
