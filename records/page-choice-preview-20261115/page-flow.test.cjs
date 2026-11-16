'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const canonical='G:/somi/JO9sa/tools/text-workshop',root=process.env.JO9_PAGE_TEST_ROOT||canonical;
if(root!==canonical){const resolve=Module._resolveFilename;Module._resolveFilename=function(name,parent,...args){if(name.startsWith('./')&&parent?.filename.startsWith(root)&&!fs.existsSync(path.resolve(path.dirname(parent.filename),name)))name=path.resolve(canonical,name);return resolve.call(this,name,parent,...args);};}
const c=require(root+'/core.cjs'),scenes=require(root+'/scenes.cjs');
function fixture(){const body=`if $args[0]='menu':
 if pick>0: gs 'event','result' & exit
 $option1='<a href="EXEC: pick=1 & gt $curloc">1. 첫 선택</a>'
 if coins<10: $option1='1. 첫 선택 (비용 부족)'
 $option2='<a href="EXEC: pick=2 & gt $curloc">2. 둘째 선택</a>'
 $option3='<a href="EXEC: pick=3 & gt $curloc">3. 셋째 선택</a>'
 if coins<5: $option3='3. 셋째 선택 (비용 부족)'
 $text=$intro+'<br><br>'+$option1+'<br>'+$option2+'<br>'+$option3
 exit
end
if $args[0]='result':
 chosen=pick
 if chosen=1:
  $bg_path='scene/others/sample1'
  $text='첫 결과 페이지'
 elseif chosen=2:
  $bg_path='scene/others/sample2'
  $text='둘째 결과 페이지'
 else
  $bg_path='scene/others/sample3'
  $text='셋째 결과 페이지'
 end
 exit
end`;
const raw=Buffer.from(['QSPGAME','','',c.shift('1',-5),c.shift('event',-5),'',c.shift(body,-5),c.shift('0',-5),''].join('\r\n'),'utf16le'),doc=c.parse(raw),es=c.entries(doc),nav=scenes.buildNavigator(doc,es),entry=es.find(e=>e.text.includes('1. 첫 선택</a>'));
return {raw,doc,es,nav,entry,context:nav.context({...entry,hash:doc.hash},undefined,'text')};}
test('three scalar-composed choices share one menu page; shortage alternatives are not extra pages',()=>{const f=fixture(),x=f.context;a.equal(x.flow.kind,'pages');a.equal(x.flow.stages.length,4);a.equal(x.flow.stages[0].parts.filter(p=>p.choice).length,3);a.equal(x.flow.stages[0].parts.filter(p=>p.choice)[0].alternatives.length,1);a.equal(x.flow.selected,1);a.equal(x.total,4);a.equal(x.branches.filter(b=>b.kind==='choice').length,3);a.ok(c.serialize(f.doc).equals(f.raw));});
test('each literal choice follows the alias to its own conditional result, including else',()=>{const f=fixture();for(const [i,b]of f.context.branches.filter(b=>b.kind==='choice').entries()){a.equal(b.destinations.length,1);const x=f.nav.open(b.destinations[0],'text');a.equal(x.flow.selected,i+2);a.equal(x.screen[0].text,['첫 결과 페이지','둘째 결과 페이지','셋째 결과 페이지'][i]);a.ok(x.images.some(v=>(typeof v==='string'?v:v.path)==='scene/others/sample'+(i+1)));a.ok(!x.images.some(v=>(typeof v==='string'?v:v.path)==='scene/others/sample'+((i+1)%3+1)));}});
test('reopening a source entry and root context retains its composed page',()=>{const f=fixture(),x=f.nav.context({...f.entry,hash:f.doc.hash},'root','text');a.equal(x.flow.selected,1);a.equal(x.total,4);const y=f.nav.context(x.flow.stages[2].variants[0].entry,x.flow.stages[2].sceneId,'text');a.equal(y.flow.selected,3);});
test('current WORK menu has one shared choice page and three result images, without QSP writes',()=>{const raw=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),doc=c.parse(raw),es=c.entries(doc),nav=scenes.buildNavigator(doc,es),e=es.find(e=>e.location==='jo9_slave_death'&&e.text.includes('jo9_sd_choice = 1 & gt'));const x=nav.context({...e,hash:doc.hash},undefined,'text');a.equal(x.flow.kind,'pages');a.equal(x.flow.stages.length,4);a.equal(x.flow.stages[0].parts.filter(p=>p.choice).length,3);for(const [i,b]of x.branches.filter(b=>b.kind==='choice').entries()){const result=nav.open(b.destinations[0],'text');a.equal(result.flow.selected,i+2);a.ok(result.images.some(v=>(typeof v==='string'?v:v.path).replaceAll('\\','/').includes('suicide_after_'+(i+1))));}a.equal(c.hash(fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp')),doc.hash);});
