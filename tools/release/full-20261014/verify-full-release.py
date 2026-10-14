from pathlib import Path
import sys,json,hashlib,re,urllib.request,urllib.parse
sys.stdout.reconfigure(encoding='utf-8')
HERE=Path(__file__).parent;REPO=Path(r'C:\Users\Ken Choung\.codex\worktrees\modding-tools-transfer\JO9sa')
sys.path.insert(0,str(REPO/'tools'));from qsp_dump import read_locations
r=json.loads((HERE/'full-release-record.json').read_text(encoding='utf-8'));stage=Path(r['stage']);game=stage/'game';source=Path(r['source'])/'game'
sha=lambda b:hashlib.sha256(b).hexdigest()
raw=(game/'jack.qsp').read_bytes();assert sha(raw)==r['source_qsp_sha256']
assert raw.decode('utf-16-le').encode('utf-16-le')==raw
locs=read_locations(raw);assert len(locs)==248
assert '2.4.0.0' in (game/'config.xml').read_bytes().decode('utf-16')
for f in ['platforms/qwindows.dll','Qt5Core.dll','Qt5WebKit.dll','Qt5Gui.dll','jack.exe','msvcr120.dll','msvcp120.dll','msvcp140.dll','vcruntime140.dll']:assert (game/'engine'/f).is_file(),f
assert (stage/'Jack-o-nine-tails.exe').is_file()
assert (game/'modtools/runtime-bundle/node.exe').is_file()
assert not (game/'modtools/text-workshop/workspace-launcher.json').exists()
assert not (game/'content/pic/SNKmod').exists()
for p in stage.rglob('*'):
 assert not p.is_symlink() and not p.is_junction()
 if p.is_file():assert not ('.bak' in p.name.lower() or p.suffix.lower() in ['.sav','.log','.qsrc','.qproj']),str(p)
# Runtime logs exist only during QA, so ignore them in this scan after cleanup.
pattern=re.compile(r'content[/\\](?:pic|snd)[/\\][^\r\n\x27\x22<>]+?\.(?:png|jpg|jpeg|gif|webp|wav|mp3|ogg)',re.I)
def refs(root,locations):
 texts=[x['body'] for x in locations]
 for folder in ['css','json']:
  for p in (root/folder).rglob('*'):
   if p.is_file() and p.suffix.lower() in ['.css','.json']:
    b=p.read_bytes()
    try:texts.append(b.decode('utf-8'))
    except UnicodeDecodeError:texts.append(b.decode('cp949',errors='replace'))
 out=set()
 for text in texts:
  text=text.replace('\\\\','\\')
  for m in pattern.finditer(text):
   rel=m[0].replace('\\','/')
   if not any(k in rel for k in ['<<','>>','${','%TEXT%']):out.add(rel)
 return out
src_refs=refs(source,locs);pkg_refs=refs(game,locs)
src_missing={p for p in src_refs if not (source/p).is_file()}
pkg_missing={p for p in pkg_refs if not (game/p).is_file()}
new_missing=pkg_missing-src_missing
assert not new_missing,'New missing runtime refs: '+str(sorted(new_missing))
original=json.loads((HERE/'release-resources/original-cuts-selected.json').read_text(encoding='utf-8'))
for f in original['items']:assert sha((game/f['target_relative']).read_bytes())==f['sha256']
editor=game/'modtools/text-workshop'
for p in editor.glob('*.cjs'):
 for ref in re.findall(r"require\(['\"](\./[^'\"]+)['\"]\)",p.read_text(encoding='utf-8')):assert (editor/ref).is_file(),str(p)+' '+ref
legacy_json=[]
for p in (game/'json').rglob('*.json'):
 try:json.loads(p.read_text(encoding='utf-8-sig'))
 except (json.JSONDecodeError,UnicodeDecodeError):
  source_p=source/p.relative_to(game);assert p.read_bytes()==source_p.read_bytes(),'A copied JSON regression: '+str(p)
  # Third-party legacy files do not all conform to Python's strict JSON parser.
  # Packaging preserves their original bytes; it does not rewrite existing packs.
  try:json.loads(source_p.read_text(encoding='utf-8-sig'));raise AssertionError('Unexpected copied JSON failure')
  except (json.JSONDecodeError,UnicodeDecodeError):pass
  legacy_json.append(p.relative_to(game).as_posix())
proof={'qsp_locations':248,'qsp_unchanged':True,'native_title':'2.4.0.0','required_runtime_files':True,'physical_original_B_cuts_verified':238,'runtime_refs':len(pkg_refs),'source_preexisting_missing_refs':len(src_missing),'package_missing_refs':len(pkg_missing),'new_missing_refs':len(new_missing),'unchanged_legacy_json_parser_exceptions':len(legacy_json),'links':0,'native_gameplay':'pending user test','preexisting_missing_examples':sorted(pkg_missing)[:40],'legacy_json_parser_exceptions':legacy_json}
(HERE/'full-release-static-QA.json').write_text(json.dumps(proof,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in proof.items() if k not in ['preexisting_missing_examples','legacy_json_parser_exceptions']},ensure_ascii=False))
