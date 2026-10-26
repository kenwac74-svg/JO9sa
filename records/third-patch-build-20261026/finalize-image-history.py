"""Record a bounded, packaged-image metadata snapshot; never restage image payloads.
--prepare writes only a compact plan. --apply requires the actual engine PASS report.
This snapshot is not a full current-image inventory and is not an inventory cache.
"""
from pathlib import Path
import argparse,csv,datetime,hashlib,io,json,os,uuid
R=Path('G:/somi/JO9sa/records/third-patch-build-20261026')
C=Path('G:/somi/IMGMG')
W=Path('G:/somi/Jack O Nine Tails v2.4_work/game')
OUT=Path('G:/somi/JO9_2.4_ThirdPatch_20261026')
TYPE='packaged_image_manifest_metadata_only'
def sha(b):return hashlib.sha256(b).hexdigest()
def readj(p):return json.loads(Path(p).read_text('utf-8-sig'))
def jb(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
def norm(p):return str(p).replace('\\','/').lower().removeprefix('game/')
def exclusive(p,b):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('xb') as f:f.write(b)
def cas(p,before,after):
 p=Path(p);assert p.read_bytes()==before,'Concurrent change '+str(p)
 t=p.with_name(p.name+'.'+uuid.uuid4().hex+'.tmp');exclusive(t,after)
 try:
  assert p.read_bytes()==before,'Concurrent change '+str(p)
  os.replace(t,p)
 finally:
  if t.exists():t.unlink()
def prepare():
 draft=readj(R/'release-history-draft.json');supp=readj(R/'supplemental-image-manifest.json');catalog=readj(R/'catalog-update-result.json')
 buildraw=(R/'BUILD_RESULT.json').read_bytes();build=json.loads(buildraw);groups=readj(R/'MANIFESTS.json')
 old=readj('G:/somi/JO9sa/records/image-history-refresh-20261021/PATCH_IMAGE_MANIFEST.json')
 baseline=readj(old['baseline']['path']);assert sha(Path(old['baseline']['path']).read_bytes())==old['baseline']['sha256']
 oldmap={norm(x['path']):x for x in old['files']};basemap={norm(x['path']):x for x in baseline['files'] if Path(x['path']).suffix.lower() in {'.png','.jpg','.jpeg','.gif','.webp','.bmp'}}
 pool={}
 for p,x in basemap.items():pool.setdefault(x['sha256'],[]).append(p)
 ledgerraw=Path(draft['ledger']['path']).read_bytes();assert sha(ledgerraw)==draft['ledger']['sha256'],'Ledger changed after bounded audit'
 events=[json.loads(s) for s in ledgerraw.decode('utf-8-sig').splitlines() if s.strip()];latest={}
 for e in events:
  for f in e['files']:latest[norm('content/pic/'+f['path'])]=(e,f)
 assert len(events)==draft['ledger']['events'];assert events[-1]['id']==draft['ledger']['lastEventId']
 ids=readj(C/'catalog_work_ids.json');codes={norm(p):v for p,v in ids['items'].items()}
 eight=readj('G:/somi/JO9sa/records/third-patch-prebuild-20261026/assets.json')['assets'];eightmap={norm(x['path']):x for x in eight}
 suppmap={norm(x['path']):x for x in supp['files']};files=[]
 for pack in ['indie','personal']:
  for f in groups[pack]:
   if f['kind']!='image':continue
   p=norm(f['path']);rel=f['path'].removeprefix('game/');b=basemap.get(p);o=oldmap.get(p);reuse=[s for s in pool.get(f['sha256'],[]) if s!=p]
   assert not b or b['sha256']!=f['sha256'],'Same-path baseline bytes should not be in a delta pack'
   cls='baseline_bytes_reused_at_other_path' if reuse else 'changed_bytes_not_in_baseline' if b else 'new_path_bytes_not_in_baseline'
   ev=latest.get(p);matching=bool(ev and ev[1]['after']==f['sha256'])
   if o:
    assert o['sha256']==f['sha256'];assert o['class']==cls
    source=o['source'];eventids=list(o.get('eventIds',[]));reuse=list(o.get('baselineReuse',[]))
   elif matching:source='workshop_recorded_replacement';eventids=[ev[0]['id']]
   elif p.startswith('content/pic/girls/full/2579/'):source='user_supplied_normalized_asset';eventids=[]
   elif p.startswith('content/pic/ui overhaul/chaotic essence'):source='approved_item_icon_asset';eventids=[]
   else:raise AssertionError('Unresolved packaged image source '+p)
   if pack=='personal':assert sha((W/rel).read_bytes())==f['sha256'],'Current personal image differs '+rel
   code=codes.get(p) or (o or {}).get('workCode');assert code,'Missing work code '+p
   row={'path':rel,'sha256':f['sha256'],'bytes':f['bytes'],'pack':pack,'source':source,'class':cls,'workCode':code,'baselineReuse':reuse,'eventIds':eventids}
   if b:row['baselineSha256']=b['sha256']
   if matching:row['latestMatchingEvent']={'id':ev[0]['id'],'createdUTC':ev[0]['created']}
   if p in eightmap:row['sourceRecord']='records/third-patch-prebuild-20261026/assets.json'
   if p in suppmap:row['sourceRecord']='records/third-patch-build-20261026/supplemental-image-manifest.json'
   files.append(row)
 assert len(files)==6944 and sum(x['pack']=='personal' for x in files)==145 and sum(x['pack']=='indie' for x in files)==6799
 assert len({norm(x['path']) for x in files})==6944
 assert sum(x['class']=='baseline_bytes_reused_at_other_path' for x in files)==275
 assert set(oldmap).issubset({norm(x['path']) for x in files})
 assert len([x for x in files if norm(x['path']) not in oldmap])==27
 assert build['runtimeCount']==6983 and len(groups['core'])==7 and len(groups['personal'])==146 and len(groups['indie'])==6830
 archives=[];sums=(OUT/'SHA256SUMS.txt').read_text('utf-8-sig')
 for pack,a in build['artifacts'].items():
  p=Path(a['archive']);assert p.parent==OUT;assert p.stat().st_size==a['bytes'];assert a['sha256'] in sums and p.name in sums
  assert a['everyMemberCRCVerified'] and a['everyRuntimeSHA256Verified'] and a['allArchivePathsSafe']
  archives.append({'kind':pack,'path':str(p),'bytes':a['bytes'],'sha256':a['sha256'],'runtimeFiles':a['runtimeCount'],'hashEvidence':'Verified builder BUILD_RESULT.json and SHA256SUMS.txt; no repeated4GB payload read.'})
 protected={x['path']:x['sha256'] for x in catalog['protectedFiles']}
 for p,h in protected.items():assert sha(Path(p).read_bytes())==h,'Protected metadata changed '+p
 for x in catalog['modifiedFiles']:assert sha(Path(x['path']).read_bytes())==x['afterSha256']
 index=C/'image_work/release-history/index.json';indexraw=index.read_bytes();assert sha(indexraw)==draft['indexUnmodifiedSha256'];ix=json.loads(indexraw);assert ix['latestRun']==draft['oldLatestRun']
 byclass={};bysource={}
 for f in files:byclass[f['class']]=byclass.get(f['class'],0)+1;bysource[f['source']]=bysource.get(f['source'],0)+1
 counts={'packagedImagePaths':6944,'personalImagePaths':145,'indieImagePaths':6799,'newlyIncludedSinceSecondPatchPaths':27,'baselineByteReusePaths':275,'byClass':byclass,'bySource':bysource,'packagedRuntimeFilesIncludingNonimage':6983,'associatedPersonalJSON':1,'artworkCreationCount':None}
 provenance={'buildResult':{'path':str(R/'BUILD_RESULT.json'),'sha256':sha(buildraw)},'allGroupsManifest':{'path':str(R/'MANIFESTS.json'),'sha256':sha((R/'MANIFESTS.json').read_bytes())},'supplementalManifest':{'path':str(R/'supplemental-image-manifest.json'),'sha256':sha((R/'supplemental-image-manifest.json').read_bytes())},'catalogUpdateResult':{'path':str(R/'catalog-update-result.json'),'sha256':sha((R/'catalog-update-result.json').read_bytes())}}
 return draft,files,counts,archives,provenance,indexraw,ix,protected

def main(a):
 if a.verify:
  r=readj(R/'image-history-final-result.json');m=readj(r['manifest']['path']);assert sha(Path(r['manifest']['path']).read_bytes())==r['manifest']['sha256'];assert len(m['files'])==6944
  ix=readj(C/'image_work/release-history/index.json');entry=next(x for x in ix['runs'] if x['runId']==r['runId']);assert entry['summarySha256']==sha(Path(entry['summary']).read_bytes())
  for p,h in r['protectedMetadata'].items():assert sha(Path(p).read_bytes())==h,p
  assert ix['latestRun']==r['runId'];print(json.dumps({'status':'VERIFIED','runId':r['runId'],'imagePaths':6944,'personalPaths':145,'indiePaths':6799,'protectedMetadata':len(r['protectedMetadata'])}));return
 draft,files,counts,archives,prov,indexraw,ix,protected=prepare()
 if a.prepare:
  result={'status':'PREPARED_AWAITING_ROOT_ENGINE_PASS','snapshotType':TYPE,'counts':counts,'archives':archives,'provenance':prov,'ledger':draft['ledger'],'schemaCompatibility':{'indexRequiredFieldsPreserved':['runId','createdUTC','summary','summarySha256','ledgerWatermarkUTC'],'imageManifestFields':['id','status','snapshotType','game','baseline','snapshot','counts','archives','files'],'fullInventoryCache':False,'patchStaging':False,'consumerAudit':'No active tool reader references release-history/delta-manifest. Existing sync-history.py only appends index entries and takes an explicit full inventory input. Metadata-only run must not be supplied as a full scan cache.'},'plannedWrites':['records/PATCH_IMAGE_MANIFEST.json','new immutable run/SYNC_RESULT.json','new immutable run/delta-manifest.json metadata reference','new immutable run/changes.csv','new immutable run/README_KO.txt','append release-history/index.json'],'plannedImageCopies':0}
  exclusive(R/'history-preparation.json',jb(result));print(json.dumps({'status':result['status'],'counts':counts,'archiveCount':len(archives),'historyAppended':False}));return
 assert a.apply and a.engine_report,'--apply requires --engine-report'
 enginepath=Path(a.engine_report);enginebytes=enginepath.read_bytes();engine=json.loads(enginebytes.decode('utf-8-sig'));assert engine.get('verdict')=='PASS','Actual release-check verdict must be PASS'
 assert not (R/'image-history-final-result.json').exists(),'History already finalized'
 now=datetime.datetime.now(datetime.timezone.utc);runid=now.strftime('%Y%m%dT%H%M%SZ')+'_thirdpatch_'+uuid.uuid4().hex[:8];run=C/'image_work/release-history/runs'/runid;assert not run.exists()
 manifestPath=R/'PATCH_IMAGE_MANIFEST.json';assert not manifestPath.exists();snapshot={'runId':runid,'path':str(run),'ledgerWatermarkUTC':draft['ledger']['lastEventCreatedUTC'],'snapshotType':TYPE,'fullInventoryCache':False,'imageStagingPresent':False}
 manifest={'id':'THIRD_PATCH_PACKAGED_IMAGES_20261026','schema':2,'status':'PACKAGED_IMAGE_METADATA_RECORDED','snapshotType':TYPE,'game':str(W),'baseline':readj('G:/somi/JO9sa/records/image-history-refresh-20261021/PATCH_IMAGE_MANIFEST.json')['baseline'],'snapshot':snapshot,'ledger':draft['ledger'],'counts':counts,'archives':archives,'sincePreviousSnapshot':{'previousRunId':draft['oldLatestRun'],'changedExistingPaths':20,'addedPaths':7,'removedPackagedPaths':0,'scope':'Packaged image set only; no full Work image-folder scan.'},'provenance':prov,'policy':{'preserveOriginalBaselineReuse':True,'pathsAreNotNewArtworkCounts':True,'rawChecksProgressAndLedgerUnchanged':True,'noRestagingImages':True,'metadataOnlySnapshotNotInventoryCache':True},'files':files}
 manifestBytes=jb(manifest);manifestRef={'path':str(manifestPath),'sha256':sha(manifestBytes),'files':6944,'snapshotType':TYPE}
 summary={'schema':2,'runId':runid,'status':'PACKAGED_IMAGE_METADATA_RECORDED','snapshotType':TYPE,'capturedUTC':now.isoformat(),'capturedKST':now.astimezone(datetime.timezone(datetime.timedelta(hours=9))).isoformat(),'ledgerWatermarkUTC':draft['ledger']['lastEventCreatedUTC'],'catalog':str(C),'game':str(W),'runDirectory':str(run),'imageManifest':manifestRef,'counts':counts,'archives':archives,'engineReleaseCheck':{'path':str(enginepath),'sha256':sha(enginebytes),'verdict':'PASS'},'catalogUpdateResult':prov['catalogUpdateResult'],'catalogUndoBackups':[x['path'] for x in readj(R/'catalog-update-result.json')['undoBackups']],'imageStagingPresent':False,'fullInventoryCache':False,'verification':{'allImageEntriesHaveHashesAndWorkCodes':True,'allPersonalCurrentHashesMatch':True,'indieEntriesBoundToVerifiedBuild':True,'priorReuse275Preserved':True,'protectedMetadataUnchanged':True,'noNewCompletionFlagsOrLedgerEvents':True},'limits':['6944 packaged image paths means145 personal+6799 Indie paths, not6944 new drawings.','27 images were added to the cumulative resource pack since the second patch; this is not27 newly created artworks.','This run contains metadata only. Image bytes are held in the listed verified archives; no patch-staging or complete current-folder inventory was created.','Do not use this run as sync-history.py --inventory input. The previous full inventory cache remains in the20261021 run.','No full Work image-folder scan or baseline-missing-path audit was performed here.']}
 csvbuf=io.StringIO(newline='');writer=csv.writer(csvbuf);writer.writerow(['workCode','path','pack','source','class','baselineSha256','sha256','eventIds','baselineReuse'])
 for f in files:writer.writerow([f['workCode'],f['path'],f['pack'],f['source'],f['class'],f.get('baselineSha256',''),f['sha256'],'|'.join(f['eventIds']),'|'.join(f['baselineReuse'])])
 for p,h in protected.items():assert sha(Path(p).read_bytes())==h,p
 exclusive(manifestPath,manifestBytes);exclusive(run/'SYNC_RESULT.json',jb(summary));exclusive(run/'delta-manifest.json',jb({'schema':2,'snapshotType':TYPE,'summary':summary,'filesReference':manifestRef,'fileCount':6944,'imageStagingPresent':False,'fullInventoryCache':False}));exclusive(run/'changes.csv',b'\xef\xbb\xbf'+csvbuf.getvalue().encode('utf-8'));exclusive(run/'index-before.json',indexraw)
 exclusive(run/'README_KO.txt',('3차 배포 이미지 메타데이터 이력\n\n개인145경로+인디6799경로=총6944경로. 2차 이후 추가27경로이며 신규 그림 제작량과 다릅니다.\n그림 원본을 복제하지 않았습니다. 실제 그림은 기록된 배포 ZIP에 있습니다.\nPATCH_IMAGE_MANIFEST와 delta-manifest의 filesReference는 동일한 봉인 명세를 가리킵니다.\n이 run에는 patch-staging 또는 전체 이미지 inventory.json이 없습니다.\nsync-history.py의 inventory 캐시로 쓰지 마십시오. 이전 전체 inventory는20261021 run에 남아 있습니다.\n기존 체크·progress·원장·별칭·고정번호는 보존했습니다.\n').encode('utf-8'))
 ix['runs'].append({'runId':runid,'createdUTC':now.isoformat(),'summary':str(run/'SYNC_RESULT.json'),'summarySha256':sha((run/'SYNC_RESULT.json').read_bytes()),'ledgerWatermarkUTC':draft['ledger']['lastEventCreatedUTC'],'snapshotType':TYPE});ix['latestRun']=runid
 for p,h in protected.items():assert sha(Path(p).read_bytes())==h,p
 cas(C/'image_work/release-history/index.json',indexraw,jb(ix))
 protectedAfter={p:h for p,h in protected.items() if Path(p)!=(C/'image_work/release-history/index.json')}
 for p,h in protectedAfter.items():assert sha(Path(p).read_bytes())==h,p
 result={'status':'PACKAGED_IMAGE_METADATA_RECORDED','runId':runid,'runDirectory':str(run),'manifest':manifestRef,'counts':counts,'archives':archives,'protectedMetadata':protectedAfter,'releaseHistoryIndexBeforeSha256':sha(indexraw),'releaseHistoryIndexAfterSha256':sha((C/'image_work/release-history/index.json').read_bytes()),'engineReport':summary['engineReleaseCheck'],'imagesRestaged':0,'gameFilesChanged':False,'FullSynchronized':False,'commit':False,'push':False}
 exclusive(R/'image-history-final-result.json',jb(result));print(json.dumps({'status':result['status'],'runId':runid,'manifest':manifestRef,'counts':counts,'historyAppended':True}))

if __name__=='__main__':
 p=argparse.ArgumentParser();g=p.add_mutually_exclusive_group(required=True);g.add_argument('--prepare',action='store_true');g.add_argument('--apply',action='store_true');g.add_argument('--verify',action='store_true');p.add_argument('--engine-report');main(p.parse_args())