'use strict';
const fs=require('fs'),path=require('path'),a=require('assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game',tmp='G:/Codex/tmp/mob-sets-20261028';
const c=require(repo+'/tools/text-workshop/core.cjs');
const raw=fs.readFileSync(process.argv[2]||game+'/jack.qsp'),d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
const db=body('#противники'),original=body('jo9_battle_fate');
function values(variable){const out=new Map();const re=new RegExp('^\\$'+variable+'\\[\'([^\']+)\'\\]\\s*=\\s*["\']([^"\']*)["\']','gm');for(const m of db.matchAll(re))out.set(m[1],m[2]);return out;}
const standing=values('силуэт_моба'),portraits=values('аватара_моба'),names=values('название_моба');
for(const line of body('colosseum_fight').split('\n')){const s=line.match(/\$силуэт_моба\['([^']+)'\]\s*=\s*"([^"]+)"/),p=line.match(/\$аватара_моба\['[^']+'\]\s*=\s*"([^"]+)"/);if(!s)continue;const key='variant:'+path.posix.basename(s[2],'.png');standing.set(key,s[2]);if(p)portraits.set(key,p[1]);names.set(key,(names.get(s[1])||s[1])+' · '+path.posix.basename(s[2],'.png'));}
const maps=new Map([...original.matchAll(/if \$jo9_bv_standing = '([^']+)': \$jo9_bv_image = '([^']+)'/g)].map(m=>[m[1],m[2]]));
const overrides=new Map([...original.matchAll(/if \$враг\[jo9_bv_slot\] = '([^']+)': \$jo9_bv_image = '([^']+)'/g)].map(m=>[m[1],m[2]]));
const defeatPath=s=>'content/pic/mob/defeated/'+path.posix.basename(s);
const missing=[...new Set(standing.values())].filter(s=>!maps.has(s)&&/^content\/pic\/(mob|characters)\/[^/]+\.png$/i.test(s));
fs.mkdirSync(tmp+'/mods',{recursive:true});
fs.writeFileSync(__dirname+'/red.json',JSON.stringify({requirement:'All battle standing sprites have a same-name defeat slot',pass:missing.length===0,missing},null,2));
a(missing.length>0,'Expected observed missing links');
const added=missing.map(s=>` if $jo9_bv_standing = '${s}': $jo9_bv_image = '${defeatPath(s)}'`);
const old="if args[2] = 1:";
a.equal(original.split(old).length,2);
const neu=old+'\r\n! JO9 MOD START MOB_SET_SLOTS_20261028\r\n'+added.join('\r\n')+'\r\n! JO9 MOD END MOB_SET_SLOTS_20261028';
const edits=[{location:'jo9_battle_fate',old,new:neu}];
const end=body('конец_боя');
for(const slot of ['jo9_bv_slot','текущий']){
 const tag=slot==='jo9_bv_slot'?'class="jo9-group-slot-<<jo9_bv_slot>>"':'id="jo9-battle-monster"';
 const before=`<img ${tag} src="<<$jo9_bv_image>>" onerror="this.style.display=String.fromCharCode(110,111,110,101)">`;
 const after=`<img ${tag} src="<<$jo9_bv_image>>" data-standing="<<$силуэт_моба[$враг[${slot}]]>>" onerror="this.onerror=null;this.src=this.getAttribute(&quot;data-standing&quot;)">`;
 a.equal(end.split(before).length,2,'result image anchor '+slot);edits.push({location:'конец_боя',old:before,new:after});
}
for(const e of edits){const l=d.locations.find(l=>l.name===e.location),s=c.shift(d.lines[l.body],5);a.equal(s.split(e.old).length,2);d.lines[l.body]=c.shift(s.split(e.old).join(e.new),-5);}
const out=c.serialize(d);a(c.serialize(c.parse(out)).equals(out));
for(const e of edits)Object.assign(e,{field:'body',count:1,patchId:'MOB_SET_SLOTS_20261028'});
const patch={id:'2026-10-28_mob_set_slots',status:'APPROVED',description:'Complete same-name defeat image slots; absent files fall back to original standing image. Display only.',before_sha256:c.hash(raw),after_sha256:c.hash(out),edits};
fs.writeFileSync(tmp+'/baseline.qsp',raw);fs.writeFileSync(tmp+'/candidate.qsp',out);fs.writeFileSync(tmp+'/mods/2026-10-28_mob_set_slots.json',JSON.stringify(patch,null,2));
for(const s of missing)maps.set(s,defeatPath(s));
function asset(p){const requested=p;let cur=game;const parts=p.split('/');for(let i=0;i<parts.length;i++){if(!fs.existsSync(cur))break;parts[i]=fs.readdirSync(cur).find(n=>n.toLowerCase()===parts[i].toLowerCase())||parts[i];cur=path.join(cur,parts[i]);}p=parts.join('/');const full=path.join(game,p);if(!fs.existsSync(full))return{path:p,runtimePath:requested,exists:false};const b=fs.readFileSync(full);return{path:p,runtimePath:requested,exists:true,bytes:b.length,sha256:c.hash(b),width:b.readUInt32BE(16),height:b.readUInt32BE(20)};}
const entries=[];
for(const [key,s] of standing){if(!/^content\/pic\/(mob|characters)\//.test(s))continue;entries.push({key,name:names.get(key)||key,portrait:portraits.get(key)?asset(portraits.get(key)):null,standing:asset(s),defeat:asset(overrides.get(key)||maps.get(s)),newLink:missing.includes(s)&&!overrides.has(key)});}
// Runtime random portrait variants have explicit sprite mappings outside the static database.
for(const [s,def] of maps)if(!entries.some(e=>e.standing.path.toLowerCase()===s.toLowerCase())){
 const base=path.posix.basename(s,'.png'),ava=base.replace(/(_\d+)?$/, '_ava$1');
 const p='content/pic/mob/'+ava+'.png';entries.push({key:'variant:'+base,name:base,portrait:fs.existsSync(game+'/'+p)?asset(p):null,standing:asset(s),defeat:asset(def),source:'explicit sprite variant'});
}
const counts=new Map();for(const e of entries)for(const role of ['portrait','standing','defeat'])if(e[role])counts.set(e[role].path,(counts.get(e[role].path)||0)+1);
for(const e of entries)for(const role of ['portrait','standing','defeat'])if(e[role])e[role].shared=counts.get(e[role].path)>1;
for(const e of entries)for(const role of ['standing','defeat']){const slot=e[role];if(slot.exists)continue;const review=path.resolve('output/battle-mob-review-20261027/images/'+(role==='standing'?'battle':'defeated')+'/'+path.posix.basename(slot.path));if(fs.existsSync(review))slot.reviewSource=review;}
const excluded=fs.readdirSync(game+'/content/pic/mob').filter(n=>/^(ride_|chariot_race)/i.test(n)&&!entries.some(e=>Object.values(e).some(x=>x&&x.path==='content/pic/mob/'+n)));
const manifest={version:1,qspBefore:c.hash(raw),qspAfter:c.hash(out),created:new Date().toISOString(),entries,excludedRaceFiles:excluded,summary:{rows:entries.length,newLinks:missing.length,missingStanding:entries.filter(e=>!e.standing.exists).length,missingDefeat:entries.filter(e=>!e.defeat.exists).length}};
fs.writeFileSync(__dirname+'/manifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync(__dirname+'/patch.json',JSON.stringify(patch,null,2));
console.log(JSON.stringify(manifest.summary));
