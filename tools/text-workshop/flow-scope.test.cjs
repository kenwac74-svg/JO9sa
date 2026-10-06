const test=require('node:test'),assert=require('node:assert/strict'),c=require('./core.cjs'),s=require('./scenes.cjs');
test('NPC dialogue template resolves its invitation scene and both background and character resources',()=>{
 const defs=[['#npc_base',`$npc_image['Sabrina']='Sabrina'
$Sabrina_pref[1]='사브리나 첫 대사'
$Sabrina_pref[2]='사브리나 다음 대사'`],['interaction_city',`if interaction_city = 1011:
 $place='Xmas_palace'
 $npc_id='Sabrina'
 $interaction_type='byer_invitation'
end`],['interaction_result_city',`if $interaction_type = 'byer_invitation':
 copyarr '$text', '$<<$npc_id>>_pref'
end`]];
 const lines=['QSPGAME','header','',c.shift(String(defs.length),-5)];for(const [n,b] of defs)lines.push(c.shift(n,-5),'',c.shift(b,-5),c.shift('0',-5));lines.push('');const d=c.parse(Buffer.from(lines.join('\r\n'),'utf16le')),es=c.entries(d),n=s.buildNavigator(d,es),e=es.find(x=>x.text==='사브리나 첫 대사'),x=n.context({...e,hash:d.hash},undefined,'text');
 assert.equal(x.flow.usage.title,'interaction_city = 1011');assert.equal(x.flow.stages.length,2);assert(x.images.some(i=>(typeof i==='string'?i:i.path)==='bg\\Xmas_palace'));assert(x.images.some(i=>i.path==='characters\\Sabrina'));
});
test('reused $text stays within the selected event, retaining its conditions and stage images',()=>{
 const body=`if interaction_city = 1:
 $text[1]='다른 이벤트 시작'
 $text[2]='다른 이벤트 끝'
 $special_image[1]='bg/other.png'
end
if interaction_city = 10131:
 $place='Xmas_palace'
 $text[1]='선택한 이벤트 시작'
 $text[2]='선택한 이벤트 다음'
 if reputation < 0:
  $text[2]='같은 이벤트 조건 분기'
 end
 $text[3]='선택한 이벤트 끝'
 $special_image[2]='scene/current.png'
end`;
 const raw=Buffer.from(['QSPGAME','header','',c.shift('1',-5),c.shift('interaction_city',-5),'',c.shift(body,-5),c.shift('0',-5),''].join('\r\n'),'utf16le'),d=c.parse(raw),es=c.entries(d),nav=s.buildNavigator(d,es),e=es.find(e=>e.text==='선택한 이벤트 시작'),x=nav.context({...e,hash:d.hash},undefined,'text');
 assert.equal(x.flow.stages.length,3);assert.equal(x.flow.stages[1].variants.length,2);assert.equal(x.flow.usage.title,'interaction_city = 10131');assert(!x.texts.some(e=>e.text.includes('다른 이벤트')));assert(!JSON.stringify(x.images).includes('other.png'));
 const next=nav.context(x.next,x.scene.id,'text');assert(JSON.stringify(next.images).includes('scene/current.png'));assert(next.flow.stages[1].variants.some(v=>v.conditions.includes('reputation < 0')));
});
