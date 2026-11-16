from pathlib import Path
import hashlib,gzip,json,difflib
H=Path('G:/somi/JO9sa/tools/modding-hub');R=Path('G:/somi/JO9sa/records/compact-cards-20261115');R.mkdir(parents=True,exist_ok=True)
names=['overrides/game-presentation.mjs','integration.css','tests/game-presentation.test.mjs'];before={n:(H/n).read_bytes() for n in names}
t=before[names[0]].decode('utf8')
a=" key=alias[key]??key.replace(/^seed_/,'');const label=rules.labels[key]??rules.status?.find(s=>s.key===key)?.label??key;"
b=a+"\n const sexSkill=rules.skills.some(g=>g.key===key||g.children.includes(key)),defaulted=sexSkill&&!present(value);if(defaulted)value=0;"
assert a in t;t=t.replace(a,b,1)
t=t.replace(" const row=rules.values[key]?.[value];let color=", " const row=rules.values[key]?.[value]??(sexSkill&&grades[value]?{text:label+' '+grades[value],cycle:'skill',index:Number(value)}:undefined);let color=",1)
t=t.replace("${row?'\\n게임 표시: '+row.text:''}`", "${row?'\\n게임 표시: '+row.text:''}${defaulted?'\\n입력값 없음: 기본값 0(F)':''}`",1)
t=t.replace("const average=!present(c[g.key])&&g.children.every(k=>present(c[k]));", "const average=!present(c[g.key]);",1)
t=t.replace("sum+Number(c[k])", "sum+Number(present(c[k])?c[k]:0)",1)
css=before[names[1]].decode('utf8')
css+='\n/* Compact single-row basic attributes in the simulator. */\n.game-attribute-grid{gap:6px;margin:7px 0 14px}.game-attribute{flex-direction:row;align-items:center;justify-content:space-between;gap:6px;padding:6px 8px;min-height:30px;box-sizing:border-box}.game-attribute>span:first-child{flex-shrink:0;white-space:nowrap;font-size:10.5px}.game-attribute .game-value{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;padding:1px 5px}\n'
test=before[names[2]].decode('utf8')+'''
test('unspecified sex skills use F while missing category averages zero defaults',()=>{
 assert.equal(describeGameValue('sub_hj',undefined).grade,'F');
 assert.equal(describeGameValue('sub_hj',undefined).color,'#cd0000');
 assert.equal(describeGameValue('beauty',undefined).text,'미설정');
 assert(!skillTree({}).includes('미설정'));assert(skillTree({}).includes('애무 F'));
 const original=rules.skills;rules.skills=[{key:'petting',label:'애무',children:['sub_hj','sub_fj']}];
 try{assert(skillTree({sub_hj:4}).includes('애무 C'));}finally{rules.skills=original;}
});
'''
diff=[]
for n,new in zip(names,[t,css,test]):
 old=before[n];(R/(n.replace('/','__')+'.gz')).write_bytes(gzip.compress(old));(H/n).write_text(new,encoding='utf8',newline='\n')
 diff.extend(difflib.unified_diff(old.decode('utf8').splitlines(True),new.splitlines(True),fromfile='before/'+n,tofile='after/'+n))
(R/'changes.diff').write_text(''.join(diff),encoding='utf8',newline='\n')
(R/'source-hashes.json').write_text(json.dumps({n:hashlib.sha256(old).hexdigest() for n,old in before.items()},indent=2),encoding='utf8')
print('Applied compact cards and default-F sex-skill display; game data unchanged.')
