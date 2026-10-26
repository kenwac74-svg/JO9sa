'use strict';
// Candidate only; baseline is pinned so a later editor save cannot be overwritten.
const fs=require('node:fs'),path=require('node:path');
const repo='G:/somi/JO9sa',core=require(repo+'/tools/text-workshop/core.cjs');
const qa=require(repo+'/tools/qa/release-check.cjs');
const tmp='G:/Codex/tmp/jo9-isabella-event-20261023';
const baseline='G:/somi/JO9_work_backups/isabella_event_image_20261023/before.qsp';
const before='daa953cd391d8268a57724d27b54194e71378dc9ef54ad1e79279cce6897d7db';
const raw=fs.readFileSync(baseline),doc=core.parse(raw);
if(core.hash(raw)!==before||!core.serialize(doc).equals(raw))throw Error('Baseline mismatch');
const loc=doc.locations.find(l=>l.name==='jo9_seed_role_images');
let body=core.shift(doc.lines[loc.body],5);
const old=" $jo9_seed_role_wanted=$args[3]\r\n if jo9_seed_role_id>=2577 and jo9_seed_role_id<=2601:";
if(body.split(old).length!==2)throw Error('Expected exact one anchor');
const block=`! JO9 MOD START INDIE_EVENT_FULLIMAGE_20261023 | 2026-10-23_indie_event_fullimage
 ! Resolve only a known default/role alias for this ID; do not rewrite actor caches.
 if $jo9_seed_role_wanted='fullimage' and $args[2] ! '':
  $jo9_seed_role_new=''
  if $args[2]=$fullimage[jo9_seed_role_id]:
   $jo9_seed_role_new=$indpack_title[jo9_seed_role_id]
  elseif $args[2]=$fullmade[jo9_seed_role_id]:
   $jo9_seed_role_new=$indpack_maid[jo9_seed_role_id]
   if $jo9_seed_role_new='': $jo9_seed_role_new=$indpack_title[jo9_seed_role_id]
  elseif $args[2]=$fullsecretary[jo9_seed_role_id]:
   $jo9_seed_role_new=$indpack_secr[jo9_seed_role_id]
   if $jo9_seed_role_new='': $jo9_seed_role_new=$indpack_title[jo9_seed_role_id]
  elseif $args[2]=$fullmistress[jo9_seed_role_id]:
   $jo9_seed_role_new=$indpack_dom[jo9_seed_role_id]
   if $jo9_seed_role_new='': $jo9_seed_role_new=$indpack_title[jo9_seed_role_id]
  end
  if $jo9_seed_role_new ! '': $result=$jo9_seed_role_new & exit
 end
! JO9 MOD END INDIE_EVENT_FULLIMAGE_20261023`.replace(/\r?\n/g,'\r\n');
const replacement=" $jo9_seed_role_wanted=$args[3]\r\n"+block+"\r\n if jo9_seed_role_id>=2577 and jo9_seed_role_id<=2601:";
body=body.replace(old,replacement);doc.lines[loc.body]=core.shift(body,-5);
const bytes=core.serialize(doc),after=core.hash(bytes);
const patch={id:'2026-10-23_indie_event_fullimage',before_sha256:before,after_sha256:after,
 edits:[{location:loc.name,field:'body',old,new:replacement,count:1}]};
qa.inspectWorld(bytes);qa.validatePatchSet([patch],before,after);
fs.mkdirSync(path.join(tmp,'mods'),{recursive:true});
fs.writeFileSync(path.join(tmp,'candidate.qsp'),bytes);
fs.writeFileSync(path.join(tmp,'mods',patch.id+'.json'),JSON.stringify(patch,null,2));
fs.writeFileSync('G:/somi/JO9sa/records/isabella-event-image-20261023/candidate-summary.json',JSON.stringify({before,after,location:loc.name,edits:1,candidate:path.join(tmp,'candidate.qsp')},null,2));
console.log(JSON.stringify({before,after,edits:1,candidate:path.join(tmp,'candidate.qsp')}));
