import os,json,pathlib,hashlib,datetime,collections
OUT=pathlib.Path(__file__).parent
R=pathlib.Path('G:/somi/JO9sa')
W=pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work')
scan=json.loads((OUT/'somi-stat-inventory.json').read_text(encoding='utf-8'))
def load(p): return json.loads(pathlib.Path(p).read_text(encoding='utf-8-sig'))
def sha(p):
 h=hashlib.sha256()
 with open(p,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def norm(p): return str(p).replace('\\','/')
protect={
 'Jack O Nine Tails v2.4_work':'Active WORK runtime, tools, authored assets and personal saves. No relocation of its root.',
 'Jack O Nine Tails v2.4 Kor_Full':'Active standalone distribution under current pre-ZIP preparation. No relocation of its root.',
 'JO9sa':'Active tracked source repository, .git, tools and records. No relocation of its root.',
 'JO9O':'Protected original client and original-cut resource provider. No relocation.',
 'IMGMG':'User-protected image resource collection. No relocation.',
 'JO9resource':'User-protected reusable creative originals. No relocation.',
 'dialogue_emoji':'Small user-authored/source image collection; not confirmed disposable or retired.',
 'pixelpure_optimizer.html':'Standalone user tool; no retirement evidence; negligible size.',
}
evidence={
 'release':'G:/somi/JO9_2.4_Release_20261019_Final/DELIVERY.json',
 'rc':'G:/somi/JO9_2.4_RC_20261018/DELIVERY.json',
 'history':'G:/somi/JO9_cleanup_history_20261020/HISTORY_INDEX.json',
 'third':'G:/somi/JO9_2.4_ThirdPatch_20261026_r1/BUILD_MANIFEST.json',
 'second':'G:/somi/JO9_2.4_SecondPatch_20261021_Split/LATEST_SPLIT_BUILD.json',
 'secondtest':'G:/somi/JO9_2.4_SecondPatch_20261021_Test/BUILD_MANIFEST.json',
 'pack':'G:/somi/JO9sa/records/character-pack-work-install-20261029/REPORT_KO.md',
 'pool':'G:/somi/JO9sa/records/full-client-preparation-20261029/REPORT_KO.md',
 'packaudit':'G:/somi/JO9sa/records/character-pack-audit-20261027_115625/REPORT_KO.md',
}
readyNames={
 'JO9_2.4_FirstPatch_20261019':['Completed historical first-patch ZIPs and release documentation. Superseded by later cumulative patches.',evidence['history']],
 'JO9_2.4_FirstPatch_20261020_r3':['Completed historical first-patch r3 package and validation artifacts. Superseded.',evidence['history']],
 'JO9_2.4_RC_20261018':['Historical RC validation tree and OptionalTools archive. Not an active client; old RC content remains recoverable through history delta and retained Full ZIP.',evidence['rc'],evidence['history']],
 'JO9_2.4_Release_20261019_Final':['Historical published Full/lite ZIPs with extracted verification residue. DELIVERY identifies seven SAVs as bundled distribution samples, not live user saves. Preserve entire directory and both ZIPs at K; no deletion or deduplication.',evidence['release'],evidence['history']],
 'JO9_2.4_SecondPatch_20261021_Test':['Completed cumulative test distribution archive with own manifest/checksum. Historical output, not current runtime.',evidence['secondtest']],
 'JO9_2.4_SecondPatch_20261021_Split':['Completed historical split release ZIPs. Runtime now supplied by active WORK/Full. Preserve all package revisions.',evidence['second']],
 'JO9_2.4_ThirdPatch_20261026':['Completed historical third-patch output. r1 is separately retained; do not assume the two revisions byte-identical.', 'G:/somi/JO9sa/docs/THIRD_PATCH_RELEASE_20261026.md'],
 'JO9_2.4_ThirdPatch_20261026_r1':['Sealed historical third-patch r1: READY_FOR_DISTRIBUTION; preserve exact ZIP streams, manifest and SHA sums.',evidence['third']],
 'JO9_Character_ImagePack_20261027':['Derived manual-integration package. The selected 27 characters,108 PNGs and27 JSONs were installed to WORK, then random-generation integration completed. Source character library remains separately protected/HOLD.',evidence['pack'],evidence['pool']],
}
# Small bounded current comparison: these 135 derived image/JSON files total about 8MB.
pack=load('G:/somi/JO9_Character_ImagePack_20261027/MANIFEST.json')
packcheck=[]
for f in pack['files']:
 p=W/f['path']; ok=p.is_file()
 packcheck.append({'path':norm(p),'exists':ok,'bytes':p.stat().st_size if ok else None,'expectedSha256':f['sha256'],'actualSha256':sha(p) if ok else None})
packMatches=sum(x['actualSha256']==x['expectedSha256'] for x in packcheck)
if packMatches!=len(packcheck):
 readyNames.pop('JO9_Character_ImagePack_20261027',None)
# Read only the exact historical bridge sources; do not traverse C or archive targets.
bridgePlan=load('C:/Users/User/.codex/.chatgpt-projects/g-p-6aad063c991081918e27b6675f290be7/outputs/storage-cleanup-20261020/archive-local-stage.json')
bridges=[]
for x in bridgePlan.get('directories',[]):
 p=pathlib.Path(x['source'])
 try:
  s=os.stat(p,follow_symlinks=False)
  isrep=bool(getattr(s,'st_file_attributes',0)&0x400)
  target=norm(os.path.realpath(p)) if isrep else None
  bridges.append({'source':norm(p),'exists':True,'reparse':isrep,'target':target,'pointsToStage':bool(target and target.lower().startswith('g:/somi/codex_archive_stage_20261020/'))})
 except FileNotFoundError: bridges.append({'source':norm(p),'exists':False})
hold={
 'Codex_Archive_Stage_20261020':{
  'reason':'Archive-to-I transfer failed with source retained. Existing C path bridges still point into this G stage; moving it without bridge retargeting breaks evidence/recovery paths.',
  'evidence':['G:/somi/Codex_Archive_Stage_20261020/보관_안내.txt','G:/somi/Codex_Archive_Stage_20261020/I-archive-worker-status.json'],
  'releaseCondition':'Separate reviewed bridge migration: retain original files, copy/hash-verify to K, retarget exact C bridges and verify paths before removing G source. Not part of move-ready list.'},
 'JO9_work_backups':{
  'reason':'Contains unique QSP/CSS/JSON/image rollback copies and backups written during current Nov1 work. Two junctions target active WORK/content. Historical verifier has fixed read dependency on scene-image-conditions-20261030.',
  'evidence':['G:/somi/JO9sa/tools/scene-image-conditions/verify.cjs:11',evidence['pool']],
  'releaseCondition':'Keep latest/unique recovery and junction-bearing subtrees. A later per-subtree archive plan must preserve restore mapping and adapt historical verifier input before relocating.'},
 'JO9_release_sync_backups':{
  'reason':'Two unique pre-sync rollback folders, including full-jack.qsp.before and full/work CSS originals; no redundancy proof. User explicitly protects unique recovery copies.',
  'evidence':['G:/somi/JO9_release_sync_backups/20261019_1792417838459/result.json'],
  'releaseCondition':'Retain in place until complete recovery verification and separately approved archival locator change.'},
 'JO9_unused_images':{
  'reason':'External archive of removed runtime images, unique original/delta/recovery material. Historical restore command explicitly requires its current journal path; not equivalent to disposable images.',
  'evidence':[evidence['pool'],'G:/somi/JO9sa/docs/UNUSED_IMAGES_ARCHIVE_20261011.md'],
  'releaseCondition':'If later relocated, preserve every original and journal, add durable old-to-new archive locator and verify restore tool against relocated archive; no deletion.'},
 'JO9_cleanup_history_20261020':{
  'reason':'Only retained content for19 old RC unique objects and cleanup restore mappings. Current archive manifests refer to retained Full/optional ZIPs at G paths.',
  'evidence':[evidence['history'],'G:/somi/JO9_cleanup_history_20261020/README_KO.md'],
  'releaseCondition':'Keep unique recovery in place for this pass. When historical Full ZIP is moved, write separate relocation index mapping its old G path to K; never rewrite immutable historical manifest.'},
 '잭오나v2.4 캐릭터 정리':{
  'reason':'Only selected new content was integrated, not whole source library. Audit found122? source JSON differences beyond image bindings and intentionally excluded/rejected changes. This is an original library with unique variants and metadata; not disposable duplicate.',
  'evidence':[evidence['packaudit'],evidence['pack'],evidence['pool']],
  'releaseCondition':'Preserve source library; any later off-drive archival must preserve source images/JSONs as originals and prove complete archive integrity, not overwrite WORK.'},
 '잭오나v2.4 캐릭터 정리.7z':{
  'reason':'Original source archive. No current archive-to-extracted content equivalence established; must not infer duplicate from filename.',
  'evidence':[evidence['packaudit']],
  'releaseCondition':'Preserve original compressed stream until full source archive verification and original-retention decision.'},
}
hold['잭오나v2.4 캐릭터 정리']['reason']='Only selected new content was integrated, not whole source library. Audit found144 JSONs with non-image field changes,92 differing image paths and intentionally excluded/rejected changes. This original library retains unique variants and metadata.'
if packMatches!=len(packcheck):hold['JO9_Character_ImagePack_20261027']={'reason':'Some currently installed files diverge from original package manifest; keep source package until reviewed.','evidence':[evidence['pack']],'releaseCondition':'Inspect comparison records; do not overwrite current user edits.'}
roots=[]; moves=[]
for raw in scan['topLevel']:
 n=raw['name']; row={k:v for k,v in raw.items() if k!='subdirectories'}
 row['path']=norm(raw['path']);row['logicalGiB']=round(raw['bytes']/1024**3,3)
 if n in protect:row.update(status='KEEP',reason=protect[n])
 elif n in hold:row.update(status='HOLD',**hold[n])
 elif n in readyNames:
  why,*refs=readyNames[n]; row.update(status='MOVE_READY_ARCHIVE',reason=why,evidence=refs)
  assert raw['reparse']==0
  moves.append({'source':row['path'],'destination':'K:/doing/JO9_trash/'+n,'bytes':raw['bytes'],'files':raw['files'],'reparse':0,'archiveFiles':raw['archives'],'sampleSaveFiles':raw['saves'],'reason':why,'evidence':refs,'moveMode':'COPY_HASH_VERIFY_REMOVE_SOURCE','preserveAllContents':True,'overwrite':False,'deduplicate':False,'journalRequired':True,'status':'PROPOSED_NOT_EXECUTED'})
 else:row.update(status='HOLD',reason='No retirement evidence.')
 roots.append(row)
archives=[]
for x in scan['archives']:
 y=dict(x);y['path']=norm(x['path'])
 try:y['hardlinkCount']=os.stat(x['path'],follow_symlinks=False).st_nlink
 except OSError:y['hardlinkCount']=None
 archives.append(y)
duplicates=[]
groups=collections.defaultdict(list)
for a in archives:
 if any(a['path'].startswith(m['source']+'/') for m in moves):groups[(pathlib.Path(a['path']).name,a['bytes'])].append(a['path'])
for (name,size),paths in groups.items():
 if len(paths)>1:duplicates.append({'filename':name,'bytesEach':size,'paths':paths,'status':'CANDIDATE_SAME_NAME_AND_SIZE_NOT_FRESH_HASH_VERIFIED','action':'Preserve all originals; mover hashes for integrity, not deduplication.'})
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
audit={
 'schema':1,'createdUtc':now,'scope':'Read-only G:/somi metadata inventory and retirement/dependency audit. No production writes, image edits, moves, deletion, ZIP creation, commit or push.',
 'inventoryStarted':scan['started'],'inventoryFinished':scan['finished'],
 'totals':{'logicalBytes':sum(r['bytes'] for r in roots),'files':sum(r['files'] for r in roots),'topLevelEntries':len(roots),'scanErrors':len(scan['errors']),'reparsePoints':len(scan['reparsePoints']),'archiveFiles':len(archives),'moveReadyLogicalBytes':sum(m['bytes'] for m in moves),'moveReadyFiles':sum(m['files'] for m in moves),'moveReadyTopLevelEntries':len(moves)},
 'limits':['Metadata file sizes are logical bytes, not guaranteed physical free-space recovery; NTFS hardlinks/compression/allocation and concurrent activity can differ.','Current archive integrity not certified by historical manifest alone: actual mover must SHA256 source and destination before source removal.','Whole character source library was not integrated; only selected27 characters/108 PNG/27 JSON subset.','No sensitive narrative or images rendered.'],
 'roots':roots,'reparsePoints':scan['reparsePoints'],'scanErrors':scan['errors'],
 'activeConfiguration':{'source':'G:/somi/JO9sa/tools/local-workspace/local.config.json','game':'G:/somi/Jack O Nine Tails v2.4_work/game','original':'G:/somi/JO9O/game','workspace':'I:/내 드라이브/Moding/JO9WORK','retiredPackagesReferenced':False},
 'activeToolReferenceAudit':{'scope':['G:/somi/JO9sa/tools','G:/somi/Jack O Nine Tails v2.4_work/game/modtools'],'retiredPackageRuntimeReadersFound':0,'historicalVerifierRead':'G:/somi/JO9sa/tools/scene-image-conditions/verify.cjs:11 reads JO9_work_backups/scene-image-conditions-20261030/catalog-*.html.gz','installerWrite':'G:/somi/JO9sa/tools/scene-image-conditions/install.cjs:3 writes same archive destination; not a retired package reader','unreadableEphemeralFile':'Active catalog folder-review/server.instance.lock is OS-locked; it was not read.'},
 'stageBridgeAudit':{'sourcePlan':'workspace/outputs/storage-cleanup-20261020/archive-local-stage.json','plannedDirectories':len(bridges),'currentBridgesToGStage':sum(b.get('pointsToStage',False) for b in bridges),'bridges':bridges,'stageStatus':load('G:/somi/Codex_Archive_Stage_20261020/I-archive-worker-status.json')},
 'characterPackIntegration':{'sourceLibrary':'G:/somi/잭오나v2.4 캐릭터 정리','fullLibraryIntegrated':False,'selectedSubsetIntegrated':True,'characters':27,'png':108,'json':27,'randomPoolIntegrated':True,'currentFilesCompared':len(packcheck),'currentHashesMatch':packMatches,'checks':packcheck,'evidence':[evidence['packaudit'],evidence['pack'],evidence['pool']]},
 'archiveDuplicateCandidates':duplicates,'archives':archives,
 'questions':[{'id':'stage-bridge-migration','status':'DEFERRED_HOLD','question':'Should a later separate operation retarget the existing C archive bridges to K after complete hash verification?','blockingScope':'Only Codex_Archive_Stage_20261020 relocation; other ready archive moves can proceed.'},{'id':'unique-recovery-relocation','status':'DEFERRED_HOLD','question':'Should unique rollback/image-history archives later be relocated with durable restore locators?','blockingScope':'Only unique backups/history/unused-image archives; preserve current originals this pass.'}],
}
plan={'schema':1,'createdUtc':now,'authority':'User authorized archival relocation to K:/doing/JO9_trash without further questions; actual moves exclusively parent agent.','status':'AUDIT_ONLY_NOT_EXECUTED','destinationRoot':'K:/doing/JO9_trash','entries':moves,'totalLogicalBytes':sum(m['bytes'] for m in moves),'totalFiles':sum(m['files'] for m in moves),'preconditions':['Resolve absolute source and destination; source must remain inside G:/somi, destination inside K:/doing/JO9_trash.','Recheck no reparse points or in-flight changed files immediately before action. Do not follow link targets.','Destination must not overwrite existing different data. If occupied, select unique dated destination and record it.','Copy all original file streams, hash-verify source and destination and compare path inventory; write durable journal before source removal.','Remove only source files whose exact destination hash verified; retain originals if interrupted or mismatch.','Preserve old relative tree, ZIPs, sample saves and manifests; do not deduplicate or recompress.','Write source-root to destination-root relocation index at K and repo record so historical absolute G references can be resolved. Historical restore manifests remain unchanged.','Verify protected active roots and current WORK/Full QSP are unchanged; report observed free-space delta separately from logical bytes.'],'protectedHoldRoots':[{'path':r['path'],'status':r['status'],'reason':r['reason']} for r in roots if r['status']!='MOVE_READY_ARCHIVE']}
for name,data in [('somi-space-audit.json',audit),('move-ready-top-level.json',plan)]: (OUT/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'audit':str(OUT/'somi-space-audit.json'),'moveReadyEntries':len(moves),'moveReadyBytes':plan['totalLogicalBytes'],'moveReadyFiles':plan['totalFiles'],'stageCBridges':audit['stageBridgeAudit']['currentBridgesToGStage'],'selectedPackHashes':f'{packMatches}/{len(packcheck)}'},ensure_ascii=False))
