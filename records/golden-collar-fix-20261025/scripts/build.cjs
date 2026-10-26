'use strict';
const fs=require('fs'),path=require('path'),zlib=require('zlib'),a=require('assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs'),qa=require('G:/somi/JO9sa/tools/qa/release-check.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game',repo='G:/somi/JO9sa',tmp='G:/Codex/tmp/jo9-golden-collar-fix-20261025';
const rec=repo+'/records/golden-collar-fix-20261025',id='2026-10-25_golden_collar_refusal_return',tag='GOLDEN_COLLAR_REFUSAL_RETURN_20261025';
const sourceAt=process.argv.indexOf('--baseline'),source=sourceAt>=0?process.argv[sourceAt+1]:game+'/jack.qsp',sourceBytes=fs.readFileSync(source),raw=source.endsWith('.gz')?zlib.gunzipSync(sourceBytes):sourceBytes;a.equal(c.hash(raw),'be2c993d24911fec5edfc0efceee9d4bd570c2d9e3a511975a69e29e383ba898');
const d=c.parse(raw),body=n=>c.shift(d.lines[d.locations.find(x=>x.name===n).body],5),cr=s=>s.replace(/\r?\n/g,'\r\n');
fs.mkdirSync(tmp+'/mods',{recursive:true});fs.mkdirSync(rec+'/scripts',{recursive:true});
fs.writeFileSync(tmp+'/before.qsp',raw);fs.writeFileSync(rec+'/before.qsp.gz',zlib.gzipSync(raw));
const inputs=[];for(const dir of [game+'/save',game+'/content/js',game+'/content/css'])if(fs.existsSync(dir))for(const name of fs.readdirSync(dir)){const p=dir+'/'+name;if(fs.statSync(p).isFile())inputs.push({path:p,sha256:c.hash(fs.readFileSync(p))});}
for(const p of [game+'/config.xml',game+'/FastQSP.ini','G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp'])if(fs.existsSync(p))inputs.push({path:p,sha256:c.hash(fs.readFileSync(p))});
fs.writeFileSync(rec+'/inputs.json',JSON.stringify(inputs,null,2)+'\n');
const edits=[];const edit=(location,old,nw)=>{old=cr(old);nw=cr(nw);a.equal(body(location).split(old).length-1,1,location+' edit unique');edits.push({location,field:'body',old,new:nw,count:1});const l=d.locations.find(l=>l.name===location);d.lines[l.body]=c.shift(body(location).replace(old,()=>nw),-5);};
const wrap=s=>'! JO9 MOD START '+tag+'\n'+s+'\n! JO9 MOD END '+tag+'\n';
const dispatch=`if $args[0] = 'golden_collar_choice':
 local $gc_role = $args[1]
 if instr('|slave|assistant|prisoner|cow|room1|room2|room3|room4|', '|' + $gc_role + '|') = 0: exit
 if $curloc ! 'choice_screen' or args[4] ! jo9_gc_seq or instr($yes, 'GC_CHOICE_20261025') = 0 or instr($no, 'GC_CHOICE_20261025') = 0: exit
 local $gc_resolve = {
  local $gc_return = $return_lock
  if $gc_return = '' or $gc_return = 'choice_screen' or $gc_return = 'next_day' or $gc_return = 'end_day_screen' or loc($gc_return) = 0: $gc_return = 'menu_form'
  $yes = '' & $no = ''
  if dynslave['id'] = args[0] and dynslave_type = args[1] and $dynslave['collar'] = 'golden_collar' and dynslave_state = CONST_INT['slave_exist']:
   if dynslave['passion_luxury'] = 0 and rebell[$dynslave_psy_status] > 0 and dynslave['obedience'] < 0 and dynslave['beaten_ever'] = 0 and dynslave['domini_dictum'] = 0:
    if args[2] = 1:
     if 'dynslave' = 'slave' and dynslave['gladiatrix'] > max(0, master_supermacy - master_style):
      dynamic $slave_fights_back
     else
      dynamic $replace($dyn_slave_forced, 'dyn'+'slave', 'dynslave')
     end
    else
     $dynslave['collar'] = 'пусто'
     dynslave_inventory['golden_collar'] += 1
    end
   end
  end
  dynslave_stat_screen = 2 & menu_form = 0
  gt iif('dynslave' = 'slave' or 'dynslave' = 'assistant', 'dynslave_stat', $gc_return)
 }
 dynamic $replace($gc_resolve, 'dyn'+'slave', $gc_role), args[2], args[3], args[5]
 exit
end
if $args[0] = 'golden_collar_load':
 local $gc_role = ''
 if $curloc = 'choice_screen' and instr($yes, 'GC_CHOICE_20261025') = 0:
  local gc_i, $gc_candidate
  for gc_i = 0 to 7:
   $gc_candidate = $iif(gc_i = 0, 'slave', $iif(gc_i = 1, 'assistant', $iif(gc_i = 2, 'prisoner', $iif(gc_i = 3, 'cow', 'room' + $str(gc_i - 3)))))
   if instr($no, '$' + $gc_candidate + "['collar'] = 'пусто'") > 0 and instr($no, $gc_candidate + "_inventory['golden_collar'] += 1") > 0 and instr($yes, '$dyn_slave_forced') > 0 and instr($yes, $gc_candidate + '_stat_screen = 2') > 0: $gc_role = $gc_candidate
  end
 end
 if instr($item_property['golden_collar'], 'GC_CHOICE_20261025') = 0: gs '#item_base'
 if $gc_role ! '':
  $yes = '' & $no = '' & $return_lock = 'menu_form'
  local $gc_resume = {
   if $dynslave['collar'] = 'golden_collar' and dynslave_state = CONST_INT['slave_exist'] and dynslave['passion_luxury'] = 0 and rebell[$dynslave_psy_status] > 0 and dynslave['obedience'] < 0 and dynslave['beaten_ever'] = 0 and dynslave['domini_dictum'] = 0:
    dynamic $replace($item_property['golden_collar'], 'dyn'+'slave', 'dynslave')
   end
   menu_form = 0
   gt 'menu_form'
  }
  dynamic $replace($gc_resume, 'dyn'+'slave', $gc_role)
 end
 exit
end`;
edit('#item_base',body('#item_base').split('\r\n')[0],wrap(dispatch).trimEnd()+'\n'+body('#item_base').split('\r\n')[0]);
const ib=body('#item_base'),gcStart=ib.indexOf("$item_property['golden_collar'] = {"),yesStart=ib.indexOf('$yes = {',gcStart),gtStart=ib.indexOf("\r\n\t\t\tgt 'choice_screen'",yesStart);
a(gcStart>=0&&yesStart>gcStart&&gtStart>yesStart,'old callbacks');const old=ib.slice(yesStart,gtStart);
const callbacks=`jo9_gc_seq += 1
            $yes = "gs '#item_base', 'golden_collar_choice', 'dynslave', " + $str(dynslave['id']) + ', ' + $str(dynslave_type) + ', ' + $str(jo9_gc_seq) + ', 1 &! GC_CHOICE_20261025'
            $no = "gs '#item_base', 'golden_collar_choice', 'dynslave', " + $str(dynslave['id']) + ', ' + $str(dynslave_type) + ', ' + $str(jo9_gc_seq) + ', 0 &! GC_CHOICE_20261025'`;
edit('#item_base',ib.slice(gcStart,gtStart),ib.slice(gcStart,yesStart).replace('는 장식 목걸이 착용을 거부한다. 그래도 강제로 잠가 버릴까?','는 금장 목줄 착용을 거부한다. 그래도 강제로 잠가 버릴까?')+wrap(callbacks).trimEnd());
edit('menu_form',"killobj &! remove any left-over clickable objects (usually arrows from a previous screen exited using ESC)\ngs '$newloc'",wrap("$return_lock = 'menu_form'\nif instr($item_property['golden_collar'], 'GC_CHOICE_20261025') = 0: gs '#item_base'")+"killobj &! remove any left-over clickable objects (usually arrows from a previous screen exited using ESC)\ngs '$newloc'");
edit('menu_form',"$return_lock  = 'menu_form'\r\n",wrap("! Return is set before equipment recalculation above."));
edit('$ongload',"saved_game_loaded = 1 &! do-once flag for $newloc", "saved_game_loaded = 1 &! do-once flag for $newloc\n"+wrap("gs '#item_base', 'golden_collar_load'"));
const bytes=c.serialize(d);qa.inspectWorld(bytes);const patch={id,description:'금장목줄 거부 A안: 재계산 전 복귀 주소, 대상·질문 검증 및 1회 처리, 구형 저장 질문 복구. WORK전용.',before_sha256:c.hash(raw),after_sha256:c.hash(bytes),edits};
fs.writeFileSync(tmp+'/candidate.qsp',bytes);for(const dest of [tmp+'/mods/'+id+'.json',rec+'/'+id+'.json'])fs.writeFileSync(dest,JSON.stringify(patch,null,2)+'\n');
if(path.resolve(__filename)!==path.resolve(rec+'/scripts/build.cjs'))fs.copyFileSync(__filename,rec+'/scripts/build.cjs');const planSource=fs.existsSync(__dirname+'/PLAN_KO.md')?__dirname+'/PLAN_KO.md':__dirname+'/../PLAN_KO.md';if(path.resolve(planSource)!==path.resolve(rec+'/PLAN_KO.md'))fs.copyFileSync(planSource,rec+'/PLAN_KO.md');
console.log(JSON.stringify({before:patch.before_sha256,after:patch.after_sha256,locations:d.locations.length,edits:edits.length,protected:inputs.length,tmp}));
