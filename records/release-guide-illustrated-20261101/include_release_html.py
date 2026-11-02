"""Register only the two requested release documents; do not rebuild the game."""
from pathlib import Path
from datetime import datetime, timezone
import copy, hashlib, json, os, sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent
REPO = Path('G:/somi/JO9sa')
FULL = Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full')
PUBLIC = REPO/'docs/release/2026-11-01'
RECORD = REPO/'records/release-guide-illustrated-20261101'
MANIFEST = FULL/'BUILD_MANIFEST.json'

def sha_bytes(b): return hashlib.sha256(b).hexdigest()
def sha(p): return sha_bytes(p.read_bytes())
def encoded_json(data): return (json.dumps(data, ensure_ascii=False, indent=2)+'\n').encode('utf-8')
def record_new(p, b):
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists():
        assert p.read_bytes() == b, 'Different existing record: '+str(p)
    else:
        with p.open('xb') as f: f.write(b)
    assert p.read_bytes() == b

build = json.loads((ROOT/'illustrated-build-report.json').read_text(encoding='utf-8'))
qa = json.loads((ROOT/'verification-illustrated.json').read_text(encoding='utf-8'))
assert qa['pass'] and qa['checks'] >= 900 and qa['temporary_directory_removed']
assert build['total_images_per_language'] == 10
assert FULL.is_dir() and PUBLIC.is_dir()
for p, digest in build['protected_hashes'].items():
    assert sha(Path(p)) == digest, 'Protected source drifted: '+p
for language in build['files']:
    assert sha(Path(language['file'])) == language['sha256']
    verified = next(row for row in qa['languages'] if row['locale']==language['locale'])
    assert verified['html_sha256'] == language['sha256']
    for image in language['images']:
        p = Path('G:/somi/Jack O Nine Tails v2.4_work/game')/image['source']
        assert sha(p) == image['source_sha256'], 'Current artwork drifted'

old_raw = MANIFEST.read_bytes()
old = json.loads(old_raw.decode('utf-8-sig'))
assert old['schema'] == 2 and old['zipCreated'] is False
assert sha(FULL/'game/jack.qsp') == old['qspSha256']
assert len(old['files']) == len({row['path'].casefold() for row in old['files']})
assert old['payloadFilesExcludingManifest'] == len(old['files'])
assert old['payloadBytesExcludingManifest'] == sum(row['bytes'] for row in old['files'])

old_allowed = {
    'JO9_2.4.1_업데이트안내.html': '5203d0571260aac31c451114b22e34438c6c10e2081ba21d01b182a7fe475ec7',
    'JO9_2.4.1_Update_Guide_EN.html': '3f2d4e6cba9a612e2dff9e5b5ab0496eaf1d479445e872f78040bd655cbeb7cc',
}
docs=[]
for language in build['files']:
    name=Path(language['file']).name
    assert name in old_allowed and '/' not in name and '\\' not in name
    for target in [FULL/name, PUBLIC/name]:
        if target.exists():
            assert sha(target) in [old_allowed[name], language['sha256']], 'Unknown document revision: '+str(target)
        assert not target.with_name(target.name+'.illustrated.tmp').exists(), 'Unexpected staging file'
    docs.append({'path':name,'bytes':language['bytes'],'sha256':language['sha256']})

new = copy.deepcopy(old)
names={row['path'].casefold() for row in docs}
unchanged = [row for row in old['files'] if row['path'].casefold() not in names]
previous_docs = [row for row in old['files'] if row['path'].casefold() in names]
new['files'] = sorted(unchanged+docs, key=lambda row:row['path'].casefold())
new['payloadFilesExcludingManifest'] = len(new['files'])
new['payloadBytesExcludingManifest'] = sum(row['bytes'] for row in new['files'])
if sorted(previous_docs, key=lambda row:row['path'].casefold()) != sorted(docs, key=lambda row:row['path'].casefold()):
    new['preparedUtc'] = datetime.now(timezone.utc).isoformat()
assert [row for row in new['files'] if row['path'].casefold() not in names] == sorted(unchanged, key=lambda row:row['path'].casefold())
for key in old:
    if key not in ['files','preparedUtc','payloadFilesExcludingManifest','payloadBytesExcludingManifest']:
        assert old[key] == new[key], 'Unrelated package metadata changed: '+key

# Existing publication sources/QA snapshots remain intact. A new record owns this revision.
record_files=['ILLUSTRATED_PLAN.md','build.py','build_bilingual.py','build_illustrated.py',
              'include_release_html.py','verify_illustrated.cjs','content.json','content.en.json',
              'content.en.groups.json','content.en.fixes.json','SOURCES.md',
              'illustrated-build-report.json','verification-illustrated.json']
for name in record_files: record_new(RECORD/name,(ROOT/name).read_bytes())
before_path=RECORD/'package-document-delta.json'
if not before_path.exists():
    record_new(before_path,encoded_json({'manifest_before_sha256':sha_bytes(old_raw),
        'before_metadata':{key:value for key,value in old.items() if key!='files'},
        'previous_document_rows':previous_docs,'registered_document_rows':docs,
        'unchanged_file_rows_sha256':sha_bytes(encoded_json(unchanged)),
        'note':'All pre-existing runtime rows are preserved. No ZIP generated. Historical build/cleanup scripts were not rerun.'}))

for language in build['files']:
    source=Path(language['file']); name=source.name; b=source.read_bytes()
    for target in [FULL/name,PUBLIC/name]:
        if target.exists() and target.read_bytes()==b: continue
        staged=target.with_name(target.name+'.illustrated.tmp')
        with staged.open('xb') as f: f.write(b)
        assert sha(staged)==language['sha256']
        os.replace(staged,target)
        assert sha(target)==language['sha256']

assert MANIFEST.read_bytes()==old_raw, 'Package manifest changed concurrently'
if new != old:
    staging=MANIFEST.with_name(MANIFEST.name+'.illustrated.tmp')
    assert not staging.exists()
    with staging.open('xb') as f: f.write(encoded_json(new))
    assert json.loads(staging.read_text(encoding='utf-8'))==new
    os.replace(staging,MANIFEST)
final=json.loads(MANIFEST.read_text(encoding='utf-8-sig'))
assert final==new
for doc in docs:
    assert doc in final['files']
    for base in [FULL,PUBLIC]:
        assert sha(base/doc['path'])==doc['sha256']
        assert (base/doc['path']).stat().st_size==doc['bytes']
for p,digest in build['protected_hashes'].items(): assert sha(Path(p))==digest

delivery={'created_utc':datetime.now(timezone.utc).isoformat(),'documents':docs,
          'distribution_folder':str(FULL),'repository_public_folder':str(PUBLIC),
          'manifest_sha256':sha(MANIFEST),'payload_files':final['payloadFilesExcludingManifest'],
          'payload_bytes':final['payloadBytesExcludingManifest'],
          'required_zip_entries':[row['path'] for row in docs],
          'images_per_language':10,'verification_checks':qa['checks'],
          'game_qsp_and_source_artwork_unchanged':True,'forum_texts_unchanged':True,
          'zip_created':False}
out_delivery=ROOT/'ILLUSTRATED_DELIVERY.json'
if out_delivery.exists():
    previous=json.loads(out_delivery.read_text(encoding='utf-8'))
    assert previous['documents']==docs and previous['manifest_sha256']==sha(MANIFEST)
    delivery=previous
record_new(out_delivery,encoded_json(delivery))
record_new(RECORD/'ILLUSTRATED_DELIVERY.json',encoded_json(delivery))
print(json.dumps(delivery,ensure_ascii=False,indent=2))
