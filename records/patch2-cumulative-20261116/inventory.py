import hashlib, json, os, zipfile
from pathlib import Path, PurePosixPath

R = Path('G:/somi/JO9sa')
W = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
T = Path('G:/Codex/tmp/patch2-cumulative-20261116')
OLD = Path('G:/somi/JO9_2.4.2_Patch1_20261115_r2/JO9_2.4.2_Patch1_20261115_r2.zip')
LOCAL = Path(__file__).resolve().parent
def load(p): return json.loads(p.read_text('utf-8-sig'))
def digest(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()
assert digest(OLD) == '65b14caef6a7196650b0e9f8381a591164e586a1c00c9520594ad20885bdffc5'
T.mkdir(parents=True, exist_ok=True)
prior = load(R/'records/hotfix-cumulative-20261115/inventory.json')
known = {r['path']:r for r in prior['fullWorkInventory']}
patch = load(R/'records/mercy-salon-patch1-20261115/package-manifest.json')
selected = {r['path']:r for r in patch['files'] if r['path'].startswith('game/')}
blocked = {'modtools','modworkpic','image_work','__jo9_imagebackups','save','.git','workshop','__pycache__','node_modules','backup','backups'}
extensions = {'.png','.jpg','.jpeg','.gif','.webp','.bmp','.svg','.ico','.json','.css','.ttf','.woff','.woff2','.otf','.xml','.mp3','.wav','.ogg','.flac'}
def allowed(rel):
    return not any(p.lower() in blocked or p.startswith('.') for p in PurePosixPath(rel).parts) and not any(t in rel.lower() for t in ['.bak','.pngbk','.backup']) and not rel.endswith('~') and rel != 'game/content/pic/girls/full/JO9_work_settings.json'
paths = {'game/jack.qsp'}
for root in ['content','json','css','fonts']:
    for parent, dirs, files in os.walk(W/root, followlinks=False):
        dirs[:] = [n for n in dirs if allowed((Path(parent)/n).relative_to(W).as_posix()) and not (Path(parent)/n).is_symlink() and not (Path(parent)/n).is_junction()]
        for n in files:
            p = Path(parent)/n
            rel = 'game/'+p.relative_to(W).as_posix()
            if allowed(rel) and p.suffix.lower() in extensions: paths.add(rel)
changed, new, audio, hashed = [], [], [], 0
for rel in sorted(paths | set(selected)):
    p = W/rel[5:]
    assert p.is_file() and not p.is_symlink() and not p.is_junction(), rel
    st = p.stat()
    prev = known.get(rel)
    needs = rel in selected or prev is None or st.st_size != prev['bytes'] or st.st_mtime_ns != prev['mtime_ns']
    if not needs: continue
    h = digest(p); hashed += 1
    row = {'path':rel,'bytes':st.st_size,'sha256':h}
    if rel in selected:
        selected[rel] = row
    if prev is None or h != prev['sha256']:
        (new if prev is None else changed).append(row)
        if p.suffix.lower() in {'.mp3','.wav','.ogg','.flac'}: audio.append(row)
        else: selected[rel] = row
assert not audio, 'Audio assets changed; user requested no audio upload: '+str([r['path'] for r in audio])
assert len(selected) >= 742
with zipfile.ZipFile(OLD) as z:
    (T/'firstpatch.qsp').write_bytes(z.read('game/jack.qsp'))
out = {'firstPatch':str(OLD),'firstPatchSha256':digest(OLD),'metadataPathsChecked':len(paths),'filesHashed':hashed,'firstPatchRuntimeFiles':742,'runtimeFiles':sorted(selected.values(),key=lambda r:r['path']),'changedSincePriorInventory':changed,'newSincePriorInventory':new,'excludedAudioChanges':audio,'baseManifests':prior['baseManifests'],'mandatoryAliases':prior['mandatoryAliasPaths']}
(LOCAL/'inventory.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({'runtimeFiles':len(selected),'metadataPathsChecked':len(paths),'filesHashed':hashed,'changed':[r['path'] for r in changed],'new':[r['path'] for r in new]},ensure_ascii=False))
