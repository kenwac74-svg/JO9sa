"""Reclaim verified duplicate ZIP storage; preserve every release path and byte.

The immutable Indie archives share NTFS hardlinks after this operation. Never
edit an archive in place: publish a fresh filename or replace a detached copy.
Only enumerated empty test roots and an exact duplicate working script are
deleted. Small unique reproduction evidence is copied, hash-verified, retained
under records, then removed from its temporary location.
"""
from pathlib import Path
import datetime, hashlib, json, os, shutil, stat, uuid

REPO=Path('G:/somi/JO9sa')
REC=REPO/'records/patch-build-space-cleanup-20261026'
LOCAL=Path('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7')
ARCHIVES=[Path('G:/somi')/directory/'JO9_2.4_IndieResources_20261021.zip' for directory in (
 'JO9_2.4_SecondPatch_20261021_Split','JO9_2.4_ThirdPatch_20261026','JO9_2.4_ThirdPatch_20261026_r1')]
PIN='ab95c03aa11beeb4f56d653b99952c584575c23c9797b16dd077fe48ebdbcda9'
SIZE=4154806749
REPARSE=0x400
def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as stream:
  for b in iter(lambda:stream.read(2**20),b''):h.update(b)
 return h.hexdigest()
def readj(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def data(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
def save(p,v):
 with p.open('xb') as stream:stream.write(data(v))
def normal_path(p):
 assert p.is_absolute() and os.path.normcase(str(p.resolve()))==os.path.normcase(str(p)),p
 for ancestor in [p,*p.parents]:
  if ancestor.exists():assert not (ancestor.lstat().st_file_attributes & REPARSE),'Reparse point: '+str(ancestor)
def scan(root):
 normal_path(root);files={};directories=[]
 def walk(p):
  st=p.lstat();assert not (st.st_file_attributes & REPARSE),'Do not follow links: '+str(p)
  if stat.S_ISDIR(st.st_mode):
   directories.append(p)
   for child in sorted(p.iterdir()):walk(child)
  else:
   assert stat.S_ISREG(st.st_mode),p
   files[p.relative_to(root).as_posix()]={'bytes':st.st_size,'sha256':sha(p)}
 walk(root);return files,directories
def delete_verified_tree(root,expected):
 files,dirs=scan(root);assert files==expected,'Changed cleanup tree: '+str(root)
 for rel,row in files.items():
  p=root/rel;assert p.resolve().is_relative_to(root.resolve());assert sha(p)==row['sha256'];p.unlink()
 for p in reversed(dirs):
  assert p.resolve().is_relative_to(root.resolve());p.rmdir()

assert not REC.exists(),'Inspect any earlier cleanup record before rerunning'
REC.mkdir();normal_path(REC)
created=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).isoformat()
before_free={drive:shutil.disk_usage(drive+':/').free for drive in ['C','G']}
protected_paths=[
 Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp'),
 Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game/jack.qsp')]
for kind in ['core','personal']:
 for record in ['third-patch-build-20261026','third-patch-build-20261026-r1']:
  protected_paths.append(Path(readj(REPO/'records'/record/'FINAL_RESULT.json')['artifacts'][kind]['archive']))
protected={str(p):sha(p) for p in protected_paths}
archive_before=[]
for p in ARCHIVES:
 normal_path(p);st=p.stat();assert st.st_size==SIZE and sha(p)==PIN,p
 archive_before.append({'path':str(p),'bytes':st.st_size,'sha256':PIN,'inode':st.st_ino,'device':st.st_dev,'links':st.st_nlink,'mtimeNs':st.st_mtime_ns})
assert len({x['device'] for x in archive_before})==1,'Archives must be on the same NTFS volume'
assert len({x['inode'] for x in archive_before})==3,'Expected three independent duplicate archives'
save(REC/'BEFORE.json',{'createdAt':created,'freeBytes':before_free,'archives':archive_before,'protectedHashes':protected})
shutil.copyfile(__file__,REC/'cleanup.py')

# A temporary hardlink is fully verified before an atomic pathname replacement.
deduplicated=[]
for p,row in zip(ARCHIVES[1:],archive_before[1:]):
 st=p.stat();assert (st.st_ino,st.st_size,st.st_mtime_ns)==(row['inode'],row['bytes'],row['mtimeNs'])
 assert ARCHIVES[0].stat().st_size==SIZE
 temporary=p.with_name(p.name+'.dedup-link-'+uuid.uuid4().hex)
 try:
  os.link(ARCHIVES[0],temporary)
  assert os.path.samefile(ARCHIVES[0],temporary) and temporary.stat().st_size==SIZE
  # The target being replaced is a proven byte-identical redundant copy.
  os.replace(temporary,p)
  assert p.exists() and os.path.samefile(ARCHIVES[0],p)
  deduplicated.append(str(p))
  save(REC/('dedup-'+str(len(deduplicated))+'.json'),{'path':str(p),'sharedWith':str(ARCHIVES[0]),'logicalBytesAndHashPreserved':True,'reclaimedDuplicateBytes':SIZE})
 finally:
  if temporary.exists():temporary.unlink()

assert sha(ARCHIVES[0])==PIN
assert all(os.path.samefile(ARCHIVES[0],p) for p in ARCHIVES)
assert ARCHIVES[0].stat().st_nlink==3

# Keep the only compact reproduction evidence instead of deleting it as tmp.
temporary_evidence=Path('G:/Codex/tmp/jo9-test-saves-20261023')
evidence_files,evidence_dirs=scan(temporary_evidence)
assert len(evidence_files)==14 and sum(x['bytes'] for x in evidence_files.values())==24283
assert not any(Path(p).suffix.lower() in {'.sav','.qsp','.zip'} for p in evidence_files)
evidence_out=REPO/'records/jo9-test-saves-load-probe-20261023'
assert not evidence_out.exists();evidence_out.mkdir()
for rel in evidence_files:
 target=evidence_out/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(temporary_evidence/rel,target)
assert scan(evidence_out)[0]==evidence_files
delete_verified_tree(temporary_evidence,evidence_files)

duplicate_script=LOCAL/'task-work/gold-ap-audit-20261026/native.cjs'
preserved_script=REPO/'records/gold-ap-audit-20261026/native.cjs'
normal_path(duplicate_script);assert sha(duplicate_script)==sha(preserved_script)=='58dd17c8f8803569af950b553224132c0aef40b2f35d688aa228e906a1307aa9'
script_bytes=duplicate_script.stat().st_size;duplicate_script.unlink()
empty_roots=[LOCAL/'task-work'/n for n in ['gold-ap-audit-20261026','gold-balance-20261026','load-probe']]
empty_roots += [Path('C:/Users/User/AppData/Local/Temp')/n for n in ['jo9-release-installer-KheSmK','jo9-windows-slots-3e9ESM','jo9-windows-slots-fZGoCK']]
removed_empty=[]
for p in empty_roots:
 if p.exists():
  files,dirs=scan(p);assert not files,'Not empty: '+str(p);delete_verified_tree(p,{});removed_empty.append(str(p))
for p,h in protected.items():assert sha(Path(p))==h,'Protected content changed: '+p
assert scan(evidence_out)[0]==evidence_files
after_free={drive:shutil.disk_usage(drive+':/').free for drive in ['C','G']}
result={'status':'CLEANUP_AND_IDENTICAL_ARCHIVE_DEDUP_VERIFIED','createdAt':created,
 'archiveContentsUnchanged':True,'allThreeReleasePathsPresent':True,'sharedArchiveLinks':3,
 'archiveSha256':PIN,'archiveBytesEach':SIZE,'duplicateArchiveStorageReleasedBytes':SIZE*len(deduplicated),
 'duplicateWorkingScriptDeletedBytes':script_bytes,'removedEmptyRoots':removed_empty,
 'uniqueEvidencePreservedAt':str(evidence_out),'uniqueEvidenceFiles':len(evidence_files),'uniqueEvidenceBytes':24283,
 'temporaryEvidenceRootAbsent':not temporary_evidence.exists(),'protectedGameAndOtherZipHashesUnchanged':True,
 'freeBytesBefore':before_free,'freeBytesAfter':after_free,
 'observedFreeDeltaBytes':{d:after_free[d]-before_free[d] for d in before_free},
 'archivesAfter':[{'path':str(p),'bytes':p.stat().st_size,'inode':p.stat().st_ino,'links':p.stat().st_nlink,'sha256':PIN} for p in ARCHIVES],
 'scope':'No save/image/original/recovery/ZIP content deleted. Duplicate immutable Indie ZIP allocations consolidated via atomic NTFS hardlink replacement.',
 'futureArchiveRule':'Treat release ZIPs as immutable; publish new filenames or detach a copy before editing. Deleting or moving one path does not remove other paths.'}
save(REC/'FINAL_RESULT.json',result)
(REC/'SUMMARY_KO.md').write_text('# 패치 빌드 공간 정리\n\n동일한 인디팩 ZIP 3개의 내용과 파일 경로를 보존하고 NTFS 하드링크로 중복 저장공간을 통합했다. '+str(SIZE*len(deduplicated))+'바이트의 중복 할당을 해제했다. 배포 ZIP을 수정할 때는 기존 파일을 덮어쓰지 말고 새 파일명으로 생성하거나 복사본을 분리한다.\n\n중복 작업 스크립트 '+str(script_bytes)+'바이트와 빈 임시 폴더를 정리했다. 유일한 14개 결과/재현 파일은 '+str(evidence_out)+'에 해시 검증 후 보존했다. 기존 QSP와 다른 배포 ZIP의 전후 해시는 동일하다. 세이브·사용자 이미지·원본·최소 복구본은 삭제하지 않았다.\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False),flush=True)
