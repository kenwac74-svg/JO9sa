import hashlib, json, os, zipfile
from pathlib import Path, PurePosixPath

R = Path('G:/somi/JO9sa')
W = Path('G:/somi/Jack O Nine Tails v2.4_work/game')
D = Path(__file__).resolve().parent
OLD = Path('G:/somi/JO9_2.4.2_Patch3_20261117_Cumulative/JO9_2.4.2_Patch3_20261117_Cumulative.zip')
EXPECTED_OLD = '950138711f793580d72afadbc4ce5a6f9c11379e92315abf8bfff5692c8b742d'

def load(p): return json.loads(p.read_text('utf-8-sig'))
def digest(p):
    h = hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()

assert digest(OLD) == EXPECTED_OLD
prior = load(R/'records/patch3-cumulative-20261117/inventory.json')
known = {r['path']:r for r in prior['fullWorkInventory']}
p2 = load(R/'records/patch3-cumulative-20261117/package-manifest.json')
selected = {r['path']:dict(r) for r in p2['files'] if r['path'].startswith('game/')}
old_selected = {k:dict(v) for k,v in selected.items()}
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
changed, new, audio, hashed, all_current, missing = [], [], [], 0, [], []
for rel in sorted(paths | set(selected)):
    p = W/rel[5:]
    if not p.is_file():
        missing.append(rel)
        continue
    assert not p.is_symlink() and not p.is_junction(), rel
    st = p.stat()
    prev = known.get(rel)
    needs = rel in selected or prev is None or st.st_size != prev['bytes'] or st.st_mtime_ns != prev['mtime_ns']
    if needs:
        h = digest(p); hashed += 1
    else:
        h = prev['sha256']
    row = {'path':rel,'bytes':st.st_size,'sha256':h}
    all_current.append(dict(row,mtime_ns=st.st_mtime_ns))
    if rel in selected: selected[rel] = row
    if prev is None or h != prev['sha256']:
        (new if prev is None else changed).append(row)
        if p.suffix.lower() in {'.mp3','.wav','.ogg','.flac'}: audio.append(row)
        else: selected[rel] = row
assert not missing, 'Prior required paths missing: '+str(missing)
assert not audio, 'Audio changed; user said not to upload: '+str([r['path'] for r in audio])
assert set(old_selected) <= set(selected)
current_qsp = digest(W/'jack.qsp')
tracked_qsp = digest(R/'assets/runtime/2.4.1/jack.qsp') # Current manual WORK dialogue is authoritative; no source overwrite
with zipfile.ZipFile(OLD) as z:
    inside = json.loads(z.read('PATCH_MANIFEST_SHA256.json'))
    assert inside['files'] == p2['files']
out = {'previousPatch':str(OLD),'previousPatchSha256':EXPECTED_OLD,'metadataPathsChecked':len(paths),'filesHashed':hashed,'previousPatchRuntimeFiles':len(old_selected),'runtimeFiles':sorted(selected.values(),key=lambda r:r['path']),'changedSincePatch3':[r for p,r in sorted(selected.items()) if p in old_selected and r['sha256'] != old_selected[p]['sha256']],'addedSincePatch3':[r for p,r in sorted(selected.items()) if p not in old_selected],'changedSincePriorInventory':changed,'newSincePriorInventory':new,'excludedAudioChanges':audio,'baseManifests':prior['baseManifests'],'mandatoryAliases':prior['mandatoryAliases'],'trackedQspSha256':tracked_qsp,'workQspSha256':current_qsp,'fullWorkInventory':all_current}
(D/'inventory.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n','utf-8')
print(json.dumps({k:out[k] for k in ['metadataPathsChecked','filesHashed','previousPatchRuntimeFiles','workQspSha256']},ensure_ascii=False))
print(json.dumps({'runtimeFiles':len(selected),'changed':[r['path'] for r in out['changedSincePatch3']],'added':[r['path'] for r in out['addedSincePatch3']],'baseManifests':out['baseManifests']},ensure_ascii=False))
