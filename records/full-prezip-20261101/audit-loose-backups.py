import os,pathlib,json,datetime,hashlib,collections,re
OUT=pathlib.Path(__file__).parent
W=pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work')
R=pathlib.Path('G:/somi/JO9sa')
plan=json.loads((OUT/'sync-plan.json').read_text(encoding='utf-8-sig'))
entries=plan['workLooseBackupArchiveCandidates']
names={pathlib.Path(x['source']).name for x in entries}
assert len(names)==len(entries)==85
allowed={'.cjs','.js','.mjs','.py','.ps1','.bat','.cmd','.vbs','.json','.xml','.ini','.cfg','.yaml','.yml','.toml'}
skip={'node_modules','.git','__pycache__','backups','tool_backups','versions','objects','image_work','sources'}
roots=[R/'tools', W/'game/modtools',W/'game/engine']
scanned=[];hits=[];errors=[];generic=[]
for root in roots:
 if not root.exists():continue
 stack=[root]
 while stack:
  d=stack.pop()
  with os.scandir(d) as it:
   for e in it:
    try:
     st=e.stat(follow_symlinks=False)
     if getattr(st,'st_file_attributes',0)&0x400:continue
     if e.is_dir(follow_symlinks=False):
      if e.name not in skip and not e.name.startswith(('cut-family-original-','test-','tmp-','node-')):stack.append(pathlib.Path(e.path))
     elif e.is_file(follow_symlinks=False) and pathlib.Path(e.name).suffix.lower() in allowed and st.st_size<40_000_000:
      scanned.append(pathlib.Path(e.path))
    except OSError as ex:errors.append({'path':e.path,'error':str(ex)})
# Exact configs/launchers at roots, not personal SAVs or archived QSP bytes.
for root in [W,W/'game',R]:
 for p in root.iterdir():
  if p.is_file() and p.suffix.lower() in allowed and not p.name.startswith('BUILD_MANIFEST'):scanned.append(p)
scanned=list(dict.fromkeys(scanned))
for p in scanned:
 try:text=p.read_text(encoding='utf-8-sig')
 except (UnicodeError,OSError):continue
 for i,line in enumerate(text.splitlines(),1):
  ns=[n for n in names if n in line]
  if ns:
   metadata=p.suffix.lower()=='.json' and ('catalog' in str(p).lower() or 'manifest' in p.name.lower())
   hits.append({'path':str(p).replace('\\','/'),'line':i,'filenames':ns,'kind':'metadata_reference' if metadata else 'review_required','excerpt':line[:500]})
  if re.search(r'\.qsp\.bak|\.bak_\*|Qsp\.bak_|bak_\$|\.bak_\s*\+',line,re.I):generic.append({'path':str(p).replace('\\','/'),'line':i,'excerpt':line[:600]})
byname=collections.defaultdict(list)
for h in hits:
 for n in h['filenames']:byname[n].append(h)
files=[]
for x in entries:
 p=pathlib.Path(x['source']);exists=p.is_file()
 st=p.stat(follow_symlinks=False) if exists else None
 refs=byname[p.name]
 unexpected=[r for r in refs if r['kind']=='review_required']
 unchanged=exists and st.st_size==x['bytes'] and st.st_mtime_ns==x['mtime_ns']
 rep=bool(st and getattr(st,'st_file_attributes',0)&0x400)
 status='ARCHIVE_SAFE' if unchanged and not rep and not unexpected else 'HOLD'
 files.append({'source':str(p).replace('\\','/'),'bytes':st.st_size if st else None,'planBytes':x['bytes'],'mtimeNs':st.st_mtime_ns if st else None,'planMtimeNs':x['mtime_ns'],'snapshotUnchanged':unchanged,'hardlinkCount':st.st_nlink if st else None,'reparse':rep,'status':status,'explicitReferences':refs,'runtimeReaderFound':bool(unexpected),'reason':'Historical point-in-time QSP backup; no active exact-name reader or latest-backup glob found. Preserve complete bytes and old-to-new restore map at K; this is archival relocation, not deletion.' if status=='ARCHIVE_SAFE' else 'File missing/changed, link, or exact code reference requires review.'})
evidence=[
 {'path':'G:/somi/JO9sa/local.config.json','line':4,'kind':'active_target','finding':'GameQsp is WORK/game/jack.qsp; no .bak selection.'},
 {'path':'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/runtime/server.json','line':4,'kind':'active_target','finding':'target is WORK/game/jack.qsp.'},
 {'path':'G:/somi/JO9sa/tools/apply_mods.ps1','line':228,'kind':'backup_writer_and_same_invocation_rollback','finding':'Constructs a fresh timestamped backup path, copies and verifies current raw QSP, restores only that exact new path on failed write. Does not enumerate or read old85 backup files.'},
 {'path':'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/apply_mods.ps1','line':132,'kind':'backup_writer','finding':'Same fresh timestamped backup construction; no historical selection.'},
 {'path':'G:/somi/Jack O Nine Tails v2.4_work/game/modtools/text-workshop/server.cjs','line':19,'kind':'different_backup_store','finding':'Editor history/undo uses runtime/backups/<id>.qsp plus matchingJSON, not loose game/jack.qsp.bak_*.'},
 {'path':'G:/somi/JO9sa/tools/local-workspace/watch-shared-work.py','line':47,'kind':'different_generic_backup_glob','finding':'Glob is runtime/backups/* filtered numeric basename and .json/.qsp, not game root or .bak_*. No candidate dependency.'},
 {'path':'G:/somi/JO9sa/tools/rollback-image-cycle.cjs','line':4,'kind':'explicit_one_off_reader_outside_scope','finding':'Reads jack.qsp.bak_20261008_060023. This filename is absent from85 candidates and is not automatically substituted from latest .bak.', 'referencedFileExists':(W/'game/jack.qsp.bak_20261008_060023').is_file()},
 {'path':'G:/somi/JO9sa/tools/build-transfer-zip.py','line':26,'kind':'backup_exclusion','finding':'Backup suffix restriction is packaging validation, not runtime input.'},
]
result={
 'schema':1,'createdUtc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'85 exact sync-plan loose WORK QSP backup candidates; launch/config/tool explicit-name and backup-glob dependency audit. No SAV content read, backup QSP content read, production writes, moves or deletion.',
 'plan':'output/full-prezip-20261101/sync-plan.json','summary':{'candidateCount':len(files),'candidateBytes':sum(x['planBytes'] for x in files),'archiveSafe':sum(x['status']=='ARCHIVE_SAFE' for x in files),'hold':sum(x['status']=='HOLD' for x in files),'sourceFilesScanned':len(scanned),'explicitNameHits':len(hits),'genericPatternHits':len(generic),'scanErrors':len(errors),'personalSaveContentsRead':0,'backupQspContentsRead':0,'productionMutations':0},
 'files':files,'evidence':evidence,'exactNameHits':hits,'genericPatternMatches':generic,'scanErrors':errors,
 'ordinaryHeldRootReview':[
  {'root':'G:/somi/Codex_Archive_Stage_20261020','finding':'Top-level worker logs/status are failed-transfer evidence; substantial contents are75 live C bridge targets. No additional ordinary files independently confirmed safe beyond existing retired-package plan. Do not move bridge payloads piecemeal.'},
  {'root':'G:/somi/JO9_work_backups','finding':'Large subtrees contain rollback originals, test results and engine/resource fixtures with two WORK junctions. No extra ordinary-only subtree proven fully redundant without recovery/reference audit. Keep current Nov1 backup originals.'},
  {'root':'G:/somi/JO9_release_sync_backups','finding':'Remaining files include unique pre-sync QSP/CSS/JSON originals and journals. They are recovery sources; no further disposable ordinary copy established.'},
  {'root':'G:/somi/JO9_unused_images','finding':'Remaining roots contain original image recovery objects/journals and pre-test autosave records. Preserve; no image or SAV payload reopened.'},
  {'root':'G:/somi/JO9_cleanup_history_20261020','finding':'Small unique delta/archive and restore-index set. No extra disposable file; preserve original historical evidence.'},
  {'root':'G:/somi/잭오나v2.4 캐릭터 정리','finding':'Original source library, with unadopted image/JSON variants. No creative original categorized as disposable.'},
 ],
 'additionalMoveReadyOutside85':[],
 'requiredMoveProtocol':['Use exact85 paths from checked plan; no wildcard removal of future .bak files.','Re-stat each source immediately before copy; if size or mtime differs from audit, hold that one file.','Copy each to uniquely named K archive subtree preserving basename, hash-verify source/destination, journal old/new/hash, then remove source only on successful match.','No content deduplication or recompression; preserve unique backup bytes and future restore lookup.','Reconfirm active jack.qsp hash/settings and runtime/backups history unchanged after archival.'],
 'limits':['No assurance about uninstalled external third-party scripts or a user manually opening a historical backup.','Binary launcher content not reverse-engineered; verified launcher/config path conventions and active tool source do not select backup candidates.','No arbitrary HOLD subtree promoted merely because old or named test.'],
}
(OUT/'loose-backup-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(result['summary'],ensure_ascii=False))
