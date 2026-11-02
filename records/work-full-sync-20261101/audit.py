from pathlib import Path
from datetime import datetime, timezone
import os, stat, hashlib, json, time, re

P = Path(__file__).resolve().parent
W = Path('G:/somi/Jack O Nine Tails v2.4_work')
F = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
R = Path('G:/somi/JO9sa/records/full-prezip-20261101')
def h(p):
    with p.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()
def dump(n, v):
    (P / n).write_text(json.dumps(v, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def exclude(s):
    s = s.casefold()
    parts = s.split('/')
    if '__jo9_imagebackups' in parts: return 'image-edit-recovery'
    if s.startswith('game/content/modworkpic/'): return 'creative-working-originals'
    if s.startswith(('game/modtools/', 'game/mods/')): return 'active-development-tools'
    if s.startswith('game/save/') or s.endswith('.sav'): return 'saves-reviewed-separately'
    if re.search(r'\.bak(?:_|\.|$)|\.(?:tmp|log|psd|kra|xcf|zip|7z|rar)$',s): return 'archive-or-working-file'
    if parts[-1] in ('thumbs.db','desktop.ini','.ds_store'): return 'filesystem-metadata'
    if s in ('fastqsp.ini','game/fastqsp.ini','game/engine/fastqsp.ini'): return 'portable-default-retained'
    if s == 'game/json/slaves/check_json.sh': return 'development-only-json-validator'
    if s.startswith('licenses/') or s == 'jack-o-nine-tails.exe': return None
    if s in ('game/jack.qsp','game/config.xml','game/icon.ico'): return None
    if s.startswith(('game/content/','game/css/','game/engine/','game/fonts/','game/json/')): return None
    return 'not-runtime-root-file'

qsp_start = [h(x / 'game/jack.qsp') for x in [W,F]]
manifest_path = F / 'BUILD_MANIFEST.json'
manifest_start = h(manifest_path)
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
expected = {x['path']: x for x in manifest['files']}
full_only = {x['path'] for x in json.loads((R / 'full-extra-paths.json').read_text(encoding='utf-8'))}
assert len(full_only) == 9
sources,excluded,links = {}, [], []
def scan(base):
    for ent in os.scandir(base):
        p = Path(ent.path)
        rel = p.relative_to(W).as_posix()
        st = ent.stat(follow_symlinks=False)
        if st.st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT:
            links.append(rel)
            continue
        if ent.is_dir(follow_symlinks=False):
            if rel.casefold() in ['game/content/modworkpic','game/modtools','game/mods','game/save'] or ent.name.casefold()=='__jo9_imagebackups':
                excluded.append(dict(path=rel, kind='preserved-working-directory'))
            else: scan(p)
        else:
            reason = exclude(rel)
            if reason: excluded.append(dict(path=rel,kind=reason))
            else: sources[rel] = dict(path=rel, bytes=st.st_size, mtime_ns=st.st_mtime_ns)
scan(W)
missing_in_full = sorted(set(sources) - set(expected))
manifest_runtime_without_work = sorted(x for x in expected if exclude(x) is None and x not in sources)
assert set(manifest_runtime_without_work) == full_only, manifest_runtime_without_work
rows=[]; incoming=[]; full_drift=[]; source_changed=[]; started=time.monotonic()
for i,(rel,source_stat) in enumerate(sorted(sources.items()),1):
    wp=W/rel; fp=F/rel
    wh=h(wp); st=wp.stat()
    if st.st_size!=source_stat['bytes'] or st.st_mtime_ns!=source_stat['mtime_ns']: source_changed.append(rel)
    fh=h(fp) if fp.is_file() else None
    row={**source_stat,'workSha256':wh,'fullSha256':fh}
    rows.append(row)
    if wh!=fh: incoming.append(row)
    if rel in expected and fh!=expected[rel]['sha256']: full_drift.append(row)
    if i%5000==0: print(json.dumps(dict(checked=i,total=len(sources),differences=len(incoming),seconds=round(time.monotonic()-started,1))),flush=True)
for rel in sorted(full_only):
    assert h(F/rel)==expected[rel]['sha256'], rel
public_saves=[r for r in expected.values() if r['path'].startswith('game/save/') and r['path'].endswith('.sav')]
assert len(public_saves)==7
for row in public_saves: assert h(F/row['path'])==row['sha256'],row['path']
qsp_end=[h(x/'game/jack.qsp') for x in [W,F]]
assert qsp_start==qsp_end
assert not source_changed,source_changed
assert manifest_start==h(manifest_path)
summary=dict(createdUtc=datetime.now(timezone.utc).isoformat(),work=str(W),full=str(F),runtimeCompared=len(rows),incomingCount=len(incoming),incoming=incoming,fullDrift=full_drift,missingInManifest=missing_in_full,sourceChanged=source_changed,workQspSha256=qsp_end[0],fullQspSha256=qsp_end[1],qspEqual=qsp_end[0]==qsp_end[1],fullOnlyCompatibilityRetained=len(full_only),publicSavesPreserved=7,excludedWorkingEntries=excluded,linksNotFollowed=links,manifestSha256=manifest_start,seconds=round(time.monotonic()-started,1),mutationsPerformed=False)
dump('runtime-comparison.json',rows)
dump('audit.json',summary)
print(json.dumps({k:v for k,v in summary.items() if k not in ['excludedWorkingEntries','incoming','fullDrift']},ensure_ascii=False),flush=True)
