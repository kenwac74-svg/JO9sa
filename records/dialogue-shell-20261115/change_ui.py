from pathlib import Path
import gzip, hashlib, json, re, shutil

R=Path('G:/somi/JO9sa');D=R/'records/dialogue-shell-20261115';D.mkdir(exist_ok=True)
local=Path(__file__).resolve().parent
paths=['tools/modding-hub/integration.mjs','tools/modding-hub/integration.css','tools/text-workshop/index.html','tools/text-workshop/workshop.css','tools/text-workshop/server.cjs']
before={}
for rel in paths:
 p=R/rel;raw=p.read_bytes();before[rel]=hashlib.sha256(raw).hexdigest();backup=D/(p.name+'.before.gz')
 if not backup.exists():backup.write_bytes(gzip.compress(raw))
 else:assert hashlib.sha256(gzip.decompress(backup.read_bytes())).hexdigest()==before[rel]

p=R/paths[0];s=p.read_text('utf-8-sig')
s=s.replace("dialogue:'기존 대사 편집실을 연결합니다. 장면·각본·이미지 연결과 저장 기능을 그대로 사용합니다.'", "dialogue:'원문을 찾아 각본으로 저장하거나, 대사를 수정하고 반영합니다.'")
needle="framePanel('dialogue',[['dialogue','대사 편집실']]);"
assert s.count(needle)==1
s=s.replace(needle,needle+"\n const dialoguePanel=panels.get('dialogue');\n dialoguePanel.querySelector('[data-workspace-tool]').remove();\n dialoguePanel.querySelector('iframe').title='대사 편집 작업 영역';\n dialoguePanel.querySelector('.workspace-original').textContent='별도 창에서 열기 ↗';")
needle="if(key==='soundList')return '/workspace/fs/'+encodeURI(raw.replaceAll('\\\\','/'));"
assert s.count(needle)==1
s=s.replace(needle,needle+"\n  if(key==='dialogue'){const url=new URL(raw,location.href);url.searchParams.set('workspace','1');return url.href;}")
s=s.replace("frame.hidden=false;link.href=url;link.hidden=false;", "frame.hidden=false;link.href=key==='dialogue'?config.tools.dialogue:url;link.hidden=false;")
needle=' function sync(){'
assert s.count(needle)==1
s=s.replace(needle,""" function fitDialogue(){
  if(api.getTab()!=='dialogue')return;
  const frame=dialoguePanel.querySelector('iframe');
  frame.style.height=Math.max(140,window.innerHeight-frame.getBoundingClientRect().top-18)+'px';
 }
 window.addEventListener('resize',()=>{if(api.getTab()==='dialogue')requestAnimationFrame(fitDialogue);});
 function sync(){""")
needle="const id=api.getTab(),parent=parentOf(id);"
assert s.count(needle)==1
s=s.replace(needle,needle+"document.body.classList.toggle('workspace-dialogue-active',id==='dialogue');if(id==='dialogue')requestAnimationFrame(fitDialogue);")
p.write_text(s,'utf-8')
p=R/paths[1];s=p.read_text('utf-8-sig')
s+='''
/* JO9 MOD START DIALOGUE_SHELL_20261115 */
body.workspace-dialogue-active{overflow:hidden}
body.workspace-dialogue-active main>footer,body.workspace-dialogue-active .page-header .eyebrow{display:none}
body.workspace-dialogue-active .page-header{padding:22px 0 18px}
#dialogue>.workspace-toolbar{justify-content:flex-end;margin:0 0 10px;padding:0}
#dialogue>.workspace-toolbar .workspace-original{background:none;border-color:transparent;font-size:10px;padding:3px 0;color:var(--muted)}
#dialogue>.workspace-toolbar .workspace-original:hover{color:var(--amber)}
#dialogue .workspace-frame{display:block;min-height:0;border:0;border-radius:0;background:var(--bg);height:calc(100dvh - 230px)}
/* JO9 MOD END DIALOGUE_SHELL_20261115 */
''';p.write_text(s,'utf-8')

p=R/paths[2];s=p.read_text('utf-8-sig');needle='<link rel="stylesheet" href="workshop.css">';assert s.count(needle)==1
s=s.replace(needle,needle+'<link rel="stylesheet" href="workshop-shell.css"><script>if(new URLSearchParams(location.search).get("workspace")==="1")document.documentElement.classList.add("workspace-embedded");</script>');p.write_text(s,'utf-8')

p=R/paths[3];s=p.read_text('utf-8-sig');marker='/* JO9 MOD SCRIPT_GAME_LAYOUT_20261110';assert marker in s
base,preview=s.split(marker,1)
# A fallback preserves every standalone colour. The embedded root supplies the host palette.
map_roles={
 'bg':['111827','0b1220','0c1220','0d1624','0f172a','111c2c','131e2d','142031'],
 'panel':['182235','172335','172438','191921'],
 'panel2':['34465f','283c54','2c3f63','23344e','18233a','244b71'],
 'line':['36445b','40516b','516078','52647b','55708d','5a7a99','64748b','374151','4b5b75','3b4d64','6b8d9f'],
 'muted':['b9c3d5','9caec5','9ca3af','8095af','6b7789','b7c6d9','acc0da','c7d3e4'],
 'text':['e5e7eb','fff','e8edf5','f3f4f6','d5dfeb','d6e6fa','d9e9f8','dce6f4','ddebff'],
 'amber':['f3c97a','d7ad64','fbbf24','f6bd61','bd8d48','ffd291'],
}
roles={code:role for role,codes in map_roles.items() for code in codes}
base=re.sub(r'#[0-9a-fA-F]{3,8}\b',lambda m:f'var(--ws-color-{m[0][1:].lower()},{m[0]})' if m[0][1:].lower() in roles else m[0],base)
p.write_text(base+marker+preview,'utf-8')
skin=(local/'workshop-shell.css').read_text('utf-8-sig')
vars=''.join(f'--ws-color-{code}:var(--ws-{role});' for code,role in roles.items())
skin='html.workspace-embedded{'+vars+'}\n'+skin
skin=skin.replace('font:13px/1.5 inherit;','font-family:inherit;font-size:13px;line-height:1.5;')
(R/'tools/text-workshop/workshop-shell.css').write_text(skin,'utf-8')
p=R/paths[4];s=p.read_text('utf-8-sig');needle="if(req.method==='GET'&&url.pathname==='/workshop.css'){";assert s.count(needle)==1
s=s.replace(needle,"if(req.method==='GET'&&['/workshop.css','/workshop-shell.css'].includes(url.pathname)){")
s=s.replace("fs.readFileSync(path.join(__dirname,'workshop.css'),'utf8')", "fs.readFileSync(path.join(__dirname,url.pathname.slice(1)),'utf8')")
p.write_text(s,'utf-8')
after={rel:hashlib.sha256((R/rel).read_bytes()).hexdigest() for rel in paths+['tools/text-workshop/workshop-shell.css']}
(D/'change.json').write_text(json.dumps({'date':'2026-11-15','scope':'dialogue section only','before':before,'after':after,'standaloneColoursPreservedByFallback':True,'nativeGamePreviewCSSUnchanged':True,'backendEditingLogicChanged':False},ensure_ascii=False,indent=2),'utf-8')
print('Changed dialogue shell and embed-only palette. Native game preview rules preserved.')
