'use strict';
// Read-only source investigation. Writes diagnostic QSPs only to the explicit tmp directory.
const fs = require('fs');
const path = require('path');
const c = require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const out = 'G:/Codex/tmp/shop-text-quest-20261026/quest';
const inputs = {work:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original:'G:/somi/JO9O/game/jack.qsp'};
const docs = Object.fromEntries(Object.entries(inputs).map(([k,p])=>[k,c.parse(fs.readFileSync(p))]));
const q = s => "'" + String(s).replaceAll("'", "''") + "'";
const crlf = s => s.replace(/\r?\n/g,'\r\n');
const getBody = (d,n) => c.shift(d.lines[d.locations.find(l=>l.name===n).body],5);
function minimalDoc(d) {
  const keep = ['Start','interaction_city','interaction_result_city','interaction_screen_city','_layout','interior_change','jo9_traits_personality','#txt_man','#txt_2_man','#txt_woman','#txt_2_woman'];
  let lines = d.lines.slice(0,4), n = 0;
  for (let i=0;i<d.locations.length;i++) {
    const loc=d.locations[i];
    if (!keep.includes(loc.name)) continue;
    const from=loc.body-2, to=i+1<d.locations.length?d.locations[i+1].body-2:d.lines.length-1;
    lines.push(...d.lines.slice(from,to)); n++;
  }
  lines[3]=c.shift(String(n),-5); lines.push('');
  return c.parse(Buffer.from(lines.join('\r\n'),'utf16le'));
}
const baseState = {
  hero_choice:1, is_home:0, slave_state:1, slave_type:2617, day:20,
  'CONST_INT["slave_exist"]':1,'CONST_INT["no_slave"]':0,
  'slave["intellect"]':5,'slave["expression"]':5,'slave["temper"]':5,
  'slave["ego"]':5,'slave["pride"]':1,'slave["secretary"]':5,
  'slave["gladiatrix"]':5,'slave["stamina"]':5,'slave["lesbiansex"]':5,
  'slave["tolerant_world"]':16,'slave["tolerant_nation"]':16,
  'slave["tolerant_family"]':16,'slave["tolerant_work"]':16,
  'npc_progress["elsa"]':3,'npc_progress["jasmine"]':2,'npc_progress["Jafar"]':1,
  'active["QA_QUEST"]':12, 'jo9_untouched_sentinel':24681357
};
const scenarios = [
  {name:'pamela-first',id:30041,state:{'npc_progress["jasmine"]':1},branch:30042,pages:15,jasmine:2,jafar:1,stage:12},
  {name:'pamela-met',id:30041,state:{},branch:30044,pages:7,jasmine:3,jafar:1,stage:12},
  {name:'pamela-pride-unmet',id:30041,state:{'slave["pride"]':5},branch:30043,pages:3,jasmine:2,jafar:1,stage:12},
  {name:'pamela-other-person-direct',id:30041,state:{slave_type:1},branch:30043,pages:3,jasmine:2,jafar:1,stage:12},
  {name:'pamela-postdone',id:30045,state:{'npc_progress["jasmine"]':3},branch:30045,pages:3,jasmine:3,jafar:1,stage:12},
  {name:'pamela-postdone-equals-only',id:30045,state:{'npc_progress["jasmine"]':3},branch:30045,pages:3,jasmine:3,jafar:1,stage:12,diagnosticRepair:true},
  {name:'jafar-first',id:30116,state:{'npc_progress["Jafar"]':0},branch:301160,pages:8,jasmine:2,jafar:1,stage:12},
  {name:'jafar-met',id:30116,state:{},branch:301162,pages:10,jasmine:2,jafar:2,stage:13},
  {name:'jafar-tolerance-zero',id:30116,state:{'slave["tolerant_world"]':0,'slave["tolerant_nation"]':0,'slave["tolerant_family"]':0,'slave["tolerant_work"]':0},branch:301161,pages:1,jasmine:2,jafar:1,stage:12},
  ...['world','nation','family','work'].map(k=>({name:'jafar-'+k+'-fifteen',id:30116,state:{['slave["tolerant_'+k+'"]']:15},branch:301161,pages:1,jasmine:2,jafar:1,stage:12})),
  {name:'jafar-skill-four',id:30116,state:{'slave["lesbiansex"]':4},branch:301161,pages:1,jasmine:2,jafar:1,stage:12},
  {name:'jafar-other-person',id:30116,state:{slave_type:1},branch:301161,pages:8,jasmine:2,jafar:1,stage:12},
  {name:'jafar-no-slave',id:30116,state:{slave_state:0},branch:301161,pages:8,jasmine:2,jafar:1,stage:12}
];
fs.mkdirSync(out,{recursive:true});
const plan = [], manifests = [];
for (const [source,d] of Object.entries(docs)) {
  for (const s of scenarios.filter(s=>source==='work'||['pamela-first','pamela-met','pamela-pride-unmet','pamela-postdone','pamela-postdone-equals-only','jafar-met','jafar-tolerance-zero'].includes(s.name))) {
    const fixture=minimalDoc(d);
    const loc=n=>fixture.locations.find(l=>l.name===n);
    const put=(n,b)=>{const l=loc(n);if(l)fixture.lines[l.body]=c.shift(crlf(b),-5);};
    if(s.diagnosticRepair){
      const body=getBody(d,'interaction_city'), start=body.indexOf('IF interaction_city = 30045:'), end=body.indexOf('IF interaction_city = 3000:',start);
      const block=body.slice(start,end), matches=block.match(/^\s*\$text\[2\]\s+(?=')/gm)||[];
      if(start<0||end<0||matches.length!==1)throw Error('Expected one missing equals in 30045');
      put('interaction_city',body.slice(0,start)+block.replace(/(^\s*\$text\[2\])(\s+)(?=')/m,'$1=$2')+body.slice(end));
    }
    for(const n of ['#txt_man','#txt_2_man','#txt_woman','#txt_2_woman'])put(n,'');
    const state={...baseState,...s.state,interaction_city:s.id};
    const setup=Object.entries(state).map(([k,v])=>k+'='+v).join('\n')+ '\n' +
      "$event['Akabur_quest']='QA_QUEST'\n$master_name='QA'\n$slave_name='QA'\n"+
      "for qa_i=1 to 8: $Jafar_quest[qa_i]='QA request'\n$Jafar_fail[1]='QA unmet'\n"+
      "nsfw=1\nsound_on=0\ngt 'interaction_city'";
    put('Start',setup);
    const marker='JO9_QA_QUEST20261026_'+source+'_'+s.name.replaceAll('-','_')+'_COMPLETE';
    const returnLoc=s.branch===301162?'city_menu_form':'shop_general';
    const assertion = [
      'interaction_city='+s.branch,'arrsize(\'$text\')-1='+s.pages,'txt_count='+s.pages,'txt=1',
      'npc_progress["jasmine"]='+s.jasmine,'npc_progress["Jafar"]='+s.jafar,
      'active["QA_QUEST"]='+s.stage,'jo9_untouched_sentinel=24681357',
      'slave_state='+state.slave_state,'slave_type='+state.slave_type,
      '$return_lock='+q(returnLoc)
    ].join(' and ');
    // The original branch runs without rendering its narrative or images. Neutralize content
    // at the screen boundary, retain actual screen initialization, then assert completion.
    const screenPrefix = "qa_original_pages=arrsize('$text')-1\n"+
      "for qa_i=1 to qa_original_pages: $text[qa_i]='QA neutral page'\n"+
      "killvar '$special_image'\nkillvar '$special_image_full'\nkillvar '$special_action'\n"+
      "killvar '$npc_info'\nkillvar '$place_info'\n$bg_path=''\n";
    const tail="\nif "+assertion+" and countobj=2:\n msg "+q(marker)+"\nelse\n msg 'JO9_QA_ASSERTION_FAILED branch <<interaction_city>> pages <<qa_original_pages>> count <<txt_count>> txt <<txt>> jasmine <<npc_progress[\"jasmine\"]>> jafar <<npc_progress[\"Jafar\"]>> stage <<active[\"QA_QUEST\"]>> return <<$return_lock>> objects <<countobj>>'\nend";
    put('interaction_screen_city',screenPrefix+getBody(d,'interaction_screen_city')+tail);
    const file=path.join(out,source+'-'+s.name+'.qsp'), raw=c.serialize(fixture);
    c.parse(raw);fs.writeFileSync(file,raw);
    plan.push({name:source+'-'+s.name,file,marker,checkpoint:'neutral interaction_screen_city completion'});
    manifests.push({source,name:s.name,inputSha256:d.hash,branch:s.branch,pages:s.pages,diagnosticEqualsRepair:!!s.diagnosticRepair,expected:{jasmine:s.jasmine,jafar:s.jafar,stage:s.stage,returnLock:returnLoc},fixtureSha256:c.hash(raw)});
  }
}
fs.copyFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/config.xml',path.join(out,'config.xml'));
const selected=process.argv[2]?plan.filter(p=>process.argv[2].split(',').includes(p.name)):plan;
fs.writeFileSync(path.join(out,'plan.json'),JSON.stringify(selected,null,2));
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),sources:Object.fromEntries(Object.entries(docs).map(([k,d])=>[k,{path:inputs[k],sha256:d.hash}])),scope:'Synthetic state, original quest branches and original city screen initialization; text/images neutralized before screen; no real save loaded.',cases:manifests},null,2));
console.log(JSON.stringify({out,cases:plan.length,inputHashes:Object.fromEntries(Object.entries(docs).map(([k,d])=>[k,d.hash]))}));
