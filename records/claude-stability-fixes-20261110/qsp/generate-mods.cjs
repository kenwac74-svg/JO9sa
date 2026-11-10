'use strict';
// Generate only declarative mods. Production QSP writes use tools/apply_mods.ps1.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'../../..'),core=require(path.join(root,'tools/text-workshop/core.cjs'));
const input=path.resolve(process.argv[2]||path.join(root,'assets/runtime/2.4.1/jack.qsp'));
const d=core.parse(fs.readFileSync(input));
assert.equal(d.hash,'8332e1857fa594283eddda448177e3e63dbf554a2f3b241350aa7a9c3291c94f','Regenerate only from reviewed baseline');
const body=name=>core.shift(d.lines[d.locations.find(l=>l.name===name).body],5);
const edit=(location,old,replacement,patchId)=>({location,field:'body',old,new:replacement,count:1,patchId});
const chain=[];let before=d.hash;
function mod(suffix,description,edits){
 const id='2026-11-10_stability_'+suffix;
 for(const e of edits){
  const l=d.locations.find(l=>l.name===e.location),b=core.shift(d.lines[l.body],5);
  assert.equal(b.split(e.old).length-1,e.count,e.location+' '+e.patchId+' old count');
  d.lines[l.body]=core.shift(b.replace(e.old,e.new),-5);
 }
 const after=crypto.createHash('sha256').update(Buffer.from(d.lines.join('\r\n'),'utf16le')).digest('hex');
 const data={id,status:'APPROVED',description,before_sha256:before,after_sha256:after,edits};
 fs.writeFileSync(path.join(root,'mods',id+'.json'),JSON.stringify(data,null,2)+'\n');
 chain.push({id,before_sha256:before,after_sha256:after,edits:edits.length,locations:[...new Set(edits.map(e=>e.location))]});before=after;
}
const sound=body('jo9_duty_text').split('\r\n').filter(x=>/jo9_rd_snd/.test(x)).join('\r\n');
assert.equal(sound.split('\r\n').length,6);
const fixedSound=sound.replace(/(?<!\$)\bjo9_rd_snd\b/g,'$jo9_rd_snd').replace(" $jo9_rd_snd=''"," local $jo9_rd_snd=''");
mod('01_duty_sound','개인실 업무 결과음 경로를 지역 문자열 변수로 통일한다. 기존 결과별 음원 경로·음소거 조건·재생 호출은 유지한다.',[
 edit('jo9_duty_text',sound,' ! JO9 MOD START STABILITY_DUTY_SOUND_20261110\r\n'+fixedSound+'\r\n ! JO9 MOD END STABILITY_DUTY_SOUND_20261110','STABILITY_DUTY_SOUND_20261110')
]);
const prior=" jo9_rd_v=dyneval('result=room'+str(jo9_rd_n)+'[\"duty\"]')\r\n if jo9_rd_v=jo9_rd_d: exit";
const assignment=" jo9_rd_v=dyneval('result=room'+str(jo9_rd_n)+'[\"duty\"]')\r\n ! JO9 MOD START STABILITY_EXTERNAL_CHORES_SET_20261110\r\n if jo9_rd_d>=2 and jo9_rd_d<=4:\r\n  dynamic \"room<<jo9_rd_n>>['cooks_rule']=0\"\r\n  dynamic \"room<<jo9_rd_n>>['cleans_rule']=0\"\r\n  dynamic \"room<<jo9_rd_n>>['duty_rules']=0\"\r\n end\r\n ! JO9 MOD END STABILITY_EXTERNAL_CHORES_SET_20261110\r\n if jo9_rd_v=jo9_rd_d: exit";
const eligible=" jo9_eligible=iif(jo9_state=CONST_INT['slave_exist'] and jo9_enabled=1 and $jo9_role!$args[1],1,0)";
const guarded=eligible+"\r\n ! JO9 MOD START STABILITY_EXTERNAL_CHORES_SELECT_20261110\r\n if jo9_i>=2 and ($args[0]='cook' or $args[0]='clean') and dyneval('result='+$jo9_role+'[\"duty\"]')>=2 and dyneval('result='+$jo9_role+'[\"duty\"]')<=4: jo9_eligible=0\r\n ! JO9 MOD END STABILITY_EXTERNAL_CHORES_SELECT_20261110";
mod('02_external_duty_chores','외근 2~4 지정 시 기존 요리·청소 지시와 집안일 소유 플래그를 해제한다. 구 저장의 외근 메이드는 요리·청소 담당자 선택에서 제외한다. 내근과 기존 다른 업무 우선순위는 유지한다.',[
 edit('jo9_room_duty',prior,assignment,'STABILITY_EXTERNAL_CHORES_SET_20261110'),
 edit('jo9_household_worker',eligible,guarded,'STABILITY_EXTERNAL_CHORES_SELECT_20261110')
]);
const refunds=[];
for(let i=1;i<=4;i++){
 const amount=[1000,400,1000,2000][i-1],factor=' * iif(difficulty_setting = 2, 150, 100) / 100';
 const oldMove=` if kulaconstruct >= ${i}: jo9_lq_value['relocation_rooms'] += ${amount}`;
 const oldRoom=`  jo9_lq_value['room${i}'] = ${amount}`;
 refunds.push(edit('jo9_liquidation_assets',oldMove,oldMove+factor,'STABILITY_ROOM_REFUND_MOVE'+i+'_20261110'));
 refunds.push(edit('jo9_liquidation_assets',oldRoom,oldRoom+factor,'STABILITY_ROOM_REFUND_ROOM'+i+'_20261110'));
}
mod('03_room_refunds','개인실 증축 철거·이주 처분가의 8개 경로에 기존 증축비와 같은 하드 1.5배를 적용한다. 20% 환급은 일반 1000/400/1000/2000, 하드 1500/600/1500/3000이다. 인테리어 환급은 이미 적용된 배수를 유지한다.',refunds);
fs.writeFileSync(path.join(__dirname,'hash-chain.json'),JSON.stringify(chain,null,2)+'\n');
console.log(JSON.stringify(chain,null,2));
