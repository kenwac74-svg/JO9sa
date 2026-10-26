"""Synchronize a release-relative image ledger without rewriting user check flags.

Run records are immutable. --apply changes only catalog rows/codes, the stale
personal-patch game setting, and the release-history latest pointer. No game,
Full, QSP, ZIP, raw event ledger, progress, status or Git mutation is performed.
"""
import argparse, collections, concurrent.futures, copy, csv, datetime as dt
import hashlib, io, json, os, pathlib as pl, re, shutil, uuid
from PIL import Image

P = pl.Path
EXT = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'}
KST = dt.timezone(dt.timedelta(hours=9))
def utc(): return dt.datetime.now(dt.timezone.utc).isoformat()
def sha(b): return hashlib.sha256(b).hexdigest()
def norm(p): return str(p).replace('\\', '/').lower().removeprefix('game/')
def js(v): return json.dumps(v, ensure_ascii=False, separators=(',', ':'))
def jb(v): return (json.dumps(v, ensure_ascii=False, indent=2)+'\n').encode('utf-8')
def readj(p): return json.loads(P(p).read_text('utf-8-sig'))
def exclusive(p, b):
    p=P(p); p.parent.mkdir(parents=True, exist_ok=True)
    with p.open('xb') as f: f.write(b)
def cas(p, expected, data):
    p=P(p)
    if p.read_bytes()!=expected: raise RuntimeError('Concurrent metadata edit: '+str(p))
    tmp=p.with_name(p.name+'.'+uuid.uuid4().hex+'.tmp')
    exclusive(tmp,data)
    try:
        if p.read_bytes()!=expected: raise RuntimeError('Concurrent metadata edit: '+str(p))
        os.replace(tmp,p)
    finally:
        if tmp.exists(): tmp.unlink()
def cat(p):
    s='\\'+str(p).replace('/','\\')
    for pattern, name in [(r'\\ui overhaul\\|\\ui[_-]overhaul\\','UO'),
        (r'\\bg\\','bg'),(r'\\characters\\','CH'),(r'\\scene\\','SC'),
        (r'\\ui\\|\\buttons\\','UI'),(r'\\girls\\','GL'),
        (r'\\mob\\','MB'),(r'\\master\\','MA')]:
        if re.search(pattern,s): return name
    return 'ET'
def scan(pic, game):
    result={}; stack=[pic]
    while stack:
        d=stack.pop()
        for f in d.iterdir():
            st=f.lstat()
            if getattr(st,'st_file_attributes',0)&0x441400: continue
            if f.is_dir():
                if f.name.startswith('__') or 'backup' in f.name.lower() or f.name=='.git': continue
                stack.append(f)
            elif f.suffix.lower() in EXT:
                rel=f.relative_to(game).as_posix()
                result[norm(rel)]=(rel,st.st_size,st.st_mtime_ns)
    return result

def main(a):
    game=P(a.game); root=P(a.catalog); pic=game/'content/pic'
    started=utc(); runid=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'_'+uuid.uuid4().hex[:8]
    run=root/'image_work/release-history/runs'/runid
    if run.exists(): raise RuntimeError('Run already exists')
    baseline_bytes=P(a.baseline).read_bytes(); baseline=json.loads(baseline_bytes.decode('utf-8-sig'))
    if sha(baseline_bytes)!=a.baseline_sha: raise RuntimeError('Published baseline hash mismatch')
    images=[f for f in baseline['files'] if P(f['path']).suffix.lower() in EXT]
    old={norm(f['path']):f for f in images}; pool=collections.defaultdict(list)
    for f in images: pool[f['sha256']].append(norm(f['path']))
    external_bytes=P(a.external).read_bytes(); plan=json.loads(external_bytes.decode('utf-8-sig'))
    external={norm(f['relative']):f for f in plan['operations']}
    cache=readj(a.inventory); cache={norm(f['p']):f for f in cache['files']}
    # Preserve the exact bytes, not a lossy reconstruction of user metadata.
    names=['catalog_merge_vs_original.html','catalog_work_ids.json','catalog_work_codes.js',
      'catalog_status.js','catalog_path_aliases.json','image_work/progress.json',
      'image_work/history.jsonl','image_work/bg_queue.json',
      'image_work/personal-patch/settings.json','image_work/personal-patch/events.jsonl']
    before={n:(root/n).read_bytes() for n in names}
    events=[json.loads(s) for s in before[names[-1]].decode('utf-8-sig').splitlines() if s.strip()]
    watermark=max(e['created'] for e in events)
    post=[e for e in events if dt.datetime.fromisoformat(e['created'].replace('Z','+00:00'))>
          dt.datetime.fromisoformat(baseline['generatedAt'].replace('Z','+00:00'))]
    timeline=collections.defaultdict(list)
    for e in post:
        for f in e['files']: timeline[norm('content/pic/'+f['path'])].append((e,f))
    paths=scan(pic,game)
    def inspect(item):
        key,(rel,size,mtime)=item; p=game/rel; c=cache.get(key)
        h=c['sha256'] if c and c['bytes']==size and int(c['mtimeNs'])==mtime and c['stable'] else sha(p.read_bytes())
        st=p.stat()
        if (st.st_size,st.st_mtime_ns)!=(size,mtime): raise RuntimeError('Image changed while reading: '+rel)
        b=old.get(key); reuse=[s for s in pool.get(h,[]) if s!=key]
        kind=('baseline_same_path_same_bytes' if b and b['sha256']==h else
              'baseline_bytes_reused_at_other_path' if reuse else
              'changed_bytes_not_in_baseline' if b else 'new_path_bytes_not_in_baseline')
        row={'path':rel,'sha256':h,'bytes':size,'mtimeNs':str(mtime),'class':kind}
        if b: row['baselineSha256']=b['sha256']
        if reuse and kind!='baseline_same_path_same_bytes': row['baselineReuse']=reuse
        e=external.get(key)
        if e and e['sha256']==h:
            row.update(source='PSP_PSP_external_integration',sourceReason=e['reason'])
        elif key in timeline and any(f['after']==h for e,f in timeline[key]):
            row['source']='workshop_recorded_replacement'
        else: row['source']='baseline' if kind=='baseline_same_path_same_bytes' else 'unresolved'
        if key in timeline:
            row['events']=[{'id':e['id'],'key':e['key'],'created':e['created'],
                'createdKST':e['createdKST'],'operation':e['operation'],
                'before':f.get('before'),'after':f['after']} for e,f in timeline[key]]
        return row
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as workers:
        current=list(workers.map(inspect,sorted(paths.items())))
    if scan(pic,game)!=paths: raise RuntimeError('Image set changed; rerun for a fresh snapshot')
    bykey={norm(r['path']):r for r in current}
    changes=[r for r in current if r['class']!='baseline_same_path_same_bytes']
    missing=[p for p in old if p.startswith('content/pic/') and p not in bykey]
    selected=[r for r in changes if r['source']=='workshop_recorded_replacement' and not r.get('baselineReuse')]
    selected_keys={norm(r['path']) for r in selected}
    selected_events=[]
    for e in post:
        files=[f for f in e['files'] if norm('content/pic/'+f['path']) in selected_keys]
        if files: selected_events.append({**e,'files':files})
    # Catalog keeps its old comparison-to-JO9O meaning. The release delta is separate.
    html=before[names[0]].decode('utf-8-sig'); match=re.search(r'var D\s*=\s*(\[[\s\S]*?\]);\s*\r?\nvar MR',html)
    if not match: raise RuntimeError('Catalog row marker missing')
    rows=json.loads(match[1]); original_rows=copy.deepcopy(rows)
    existing={norm(r[0]):r for r in rows}; added=[]; refreshed=[]; kind_corrections=[]
    for r in changes:
        key=norm(r['path']); d=existing.get(key)
        if not d:
            if r['source']=='unresolved': continue
            d=[r['path'].replace('/','\\'),'a','indi' if r['source']=='PSP_PSP_external_integration' else 'etc',r['bytes'],0,0,0,'']
            rows.append(d); existing[key]=d; added.append(d[0])
        previous=list(d)
        with Image.open(game/r['path']) as im: w,h=im.size
        d[3]=r['bytes']; d[5]=w; d[6]=h
        if d[1]=='o':
            original=P(a.original)/r['path']
            if not original.is_file(): raise RuntimeError('Catalog original missing: '+str(original))
            original_hash=sha(original.read_bytes())
            if original_hash!=r['sha256']:
                d[1]='r'
                kind_corrections.append({'path':d[0],'before':'o','after':'r','originalSha256':original_hash,'currentSha256':r['sha256']})
        if r['source']=='PSP_PSP_external_integration': d[2]='indi'
        if d!=previous and d[0] not in added: refreshed.append(d[0])
    ids=json.loads(before[names[1]].decode('utf-8-sig')); original_ids=copy.deepcopy(ids)
    spellings=collections.Counter(r[0].lower() for r in rows)
    for d in rows:
        p=d[0]
        if p not in ids['items'] and p.lower() in ids['items'] and spellings[p.lower()]==1:
            ids['items'][p]=ids['items'][p.lower()]
    for d in sorted(rows,key=lambda d:d[0]):
        p=d[0]
        if p not in ids['items']:
            c=cat(p); ids['counters'][c]=ids['counters'].get(c,0)+1
            ids['items'][p]=c+'-'+str(ids['counters'][c]).zfill(4)
    for k,v in original_ids['items'].items():
        if ids['items'][k]!=v: raise RuntimeError('Existing work ID changed')
    idmap={norm(k):v for k,v in ids['items'].items()}
    for r in changes: r['workCode']=idmap.get(norm(r['path']))
    new_html=html[:match.start(1)]+js(rows)+html[match.end(1):]
    new_html,n=re.subn(r'var MR=("(?:[^"\\]|\\.)*")',lambda m:'var MR='+json.dumps(str(game)),new_html,count=1)
    if n!=1: raise RuntimeError('Catalog MR marker missing')
    # Keep all old code aliases and all original unit pairings.
    codes_js=before[names[2]].decode('utf-8-sig')
    cm=re.search(r'window\.JO9_WORK_CODES\s*=\s*',codes_js)
    if not cm: raise RuntimeError('Work code map missing')
    codes,code_length=json.JSONDecoder().raw_decode(codes_js[cm.end():])
    codes_before=copy.deepcopy(codes)
    for d in rows:
        if d[0] not in codes: codes[d[0]]=ids['items'][d[0]]
    for k,v in codes_before.items():
        if codes[k]!=v: raise RuntimeError('Old display code changed')
    codes_js=codes_js[:cm.end()]+js(codes)+codes_js[cm.end()+code_length:]
    settings=json.loads(before[names[-2]].decode('utf-8-sig'))
    settings.update(game=str(game),catalogRoot=str(root))
    mutations={names[0]:new_html.encode('utf-8'), names[1]:jb(ids),
        names[2]:codes_js.encode('utf-8'),names[-2]:jb(settings)}
    mutations={n:b for n,b in mutations.items() if b!=before[n]}
    protected=[game/'jack.qsp',game/'css/base.css',P(a.full)/'jack.qsp']
    protected_before={str(p):sha(p.read_bytes()) for p in protected}
    # Everything below is a new, immutable run directory. Existing snapshots stay intact.
    for n,b in before.items(): exclusive(run/'metadata-before'/n,b)
    exclusive(run/'evidence/BUILD_MANIFEST_2.4.json',baseline_bytes)
    exclusive(run/'evidence/indie-image-plan.json',external_bytes)
    exclusive(run/'inventory.json',jb({'capturedUTC':utc(),'files':current}))
    ledger=run/'selected-personal-ledger'
    exclusive(ledger/'events.jsonl',(''.join(js(e)+'\n' for e in selected_events)).encode('utf-8'))
    exclusive(ledger/'settings.json',jb({**settings,'releaseBaseline':a.baseline,
        'releaseBaselineSha256':sha(baseline_bytes),'capturedLedgerWatermark':watermark}))
    objects={f['after'] for e in selected_events for f in e['files']}
    for h in objects:
        source=root/'image_work/personal-patch/objects'/h
        b=source.read_bytes()
        if sha(b)!=h: raise RuntimeError('Recorded image object hash mismatch: '+h)
        exclusive(ledger/'objects'/h,b)
    for r in selected:
        b=(ledger/'objects'/r['sha256']).read_bytes()
        if sha((game/r['path']).read_bytes())!=r['sha256']: raise RuntimeError('Selected Work file changed: '+r['path'])
        exclusive(run/'patch-staging/game'/r['path'],b)
    summary={'version':1,'runId':runid,'startedUTC':started,'capturedUTC':utc(),
      'capturedKST':dt.datetime.now(KST).isoformat(),'ledgerWatermarkUTC':watermark,
      'status':'PREPARED','game':str(game),'catalog':str(root),'runDirectory':str(run),
      'baseline':{'path':a.baseline,'sha256':sha(baseline_bytes),'generatedAt':baseline['generatedAt']},
      'externalPlan':{'path':a.external,'sha256':sha(external_bytes)},
      'counts':{'currentImageFiles':len(current),'unchanged':len(current)-len(changes),
        'deltaPaths':len(changes),'missingBaselinePicPaths':len(missing),
        'byClass':dict(collections.Counter(r['class'] for r in changes)),
        'bySource':dict(collections.Counter(r['source'] for r in changes)),
        'selectedPersonalPatchFiles':len(selected),'selectedHistoryEvents':len(selected_events),
        'preservedOldWorkIds':len(original_ids['items']),'addedCatalogRows':len(added),
        'refreshedCatalogRows':len(refreshed),'newWorkIds':len(ids['items'])-len(original_ids['items'])},
      'catalogAddedPaths':added,'catalogRefreshedPaths':refreshed,'catalogKindCorrections':kind_corrections,'missingBaselinePicPaths':missing,
      'limits':['Counts are image file paths, not artwork types, new drawings, authors or today\'s output.',
        'PSP_PSP external integration stays separate from the personal patch. Same baseline bytes are reuse.',
        'No checklist flags, progress or existing raw event ledger are rewritten.',
        'This is an immutable captured run. Later Workshop saves continue in the canonical raw ledger.',
        'No public ZIP, Full synchronization, game asset mutation, Git commit or push.'],
      'mutations':{n:{'before':sha(before[n]),'after':sha(b)} for n,b in mutations.items()},
      'protectedBefore':protected_before}
    exclusive(run/'delta-manifest.json',jb({'summary':summary,'files':changes}))
    buf=io.StringIO(newline=''); w=csv.writer(buf)
    w.writerow(['작업번호','경로','출처','2.4대비','2.4 SHA256','현재 SHA256','이벤트ID','원래 작업시각(KST)','기존 그림 재사용 경로'])
    for r in changes:
        ev=r.get('events',[])
        w.writerow([r['workCode'],r['path'],r['source'],r['class'],r.get('baselineSha256',''),r['sha256'],
          '|'.join(e['id'] for e in ev),'|'.join(e['createdKST'] for e in ev),'|'.join(r.get('baselineReuse',[]))])
    exclusive(run/'changes.csv',b'\xef\xbb\xbf'+buf.getvalue().encode('utf-8'))
    exclusive(run/'README_KO.txt',(
      '2.4 이후 이미지 패치 동기화 이력\n\n'
      f'기준: 실제 배포된 2.4 BUILD_MANIFEST / {sha(baseline_bytes)}\n'
      f'원장 마감시각(UTC): {watermark}\n'
      'changes.csv: 작업번호, 경로, 출처, 전후 해시, 원래 작업시각, 이벤트 ID.\n'
      'delta-manifest.json: 2.4 대비 변경 전체. 같은 그림의 경로 재사용도 구별.\n'
      'metadata-before: 동기화 직전 관리자료의 원본 바이트.\n'
      'selected-personal-ledger: 기존 원장을 훼손하지 않은 개인 교체 기록/결과 사본.\n'
      'patch-staging/game: 현재 Work와 해시가 일치하는 개인 이미지 패치 후보만 포함.\n'
      '인디 통합 이미지와 기존 그림 재사용은 개인 패치 후보에서 제외.\n'
      '작업량은 파일 경로 수이며 신규 그림 종수/제작자 수가 아닙니다.\n'
      '이후 Workshop 저장은 기존 원장에 자동 누적됩니다. 다음 동기화에서는 새 run을 만듭니다.\n'
      '완료/작업 중 체크는 그대로 보존합니다. QSP/Full/배포 ZIP/Git은 변경하지 않습니다.\n').encode('utf-8'))
    if a.apply:
        # Guard all live metadata before any mutation; never overwrite a new user save.
        for n,b in before.items():
            if (root/n).read_bytes()!=b: raise RuntimeError('Live metadata changed; prepared run retained: '+n)
        for n in [names[1],names[0],names[2],names[-2]]:
            if n in mutations: cas(root/n,before[n],mutations[n])
        summary['status']='APPLIED'
    else: summary['status']='DRY_RUN'
    untouched=[n for n in names if n not in mutations]
    corrected={r['path'] for r in kind_corrections}
    summary['verification']={'originalRowOrderAndPairsPreserved':all(
      rows[i][0]==d[0] and (rows[i][1]==d[1] or d[0] in corrected) and rows[i][4]==d[4] and rows[i][7]==d[7]
      for i,d in enumerate(original_rows)),
      'oldIdsPreserved':all(ids['items'][k]==v for k,v in original_ids['items'].items()),
      'protectedFilesUnchanged':all(sha(P(p).read_bytes())==h for p,h in protected_before.items()),
      'untouchedMetadataByteIdentical':all((root/n).read_bytes()==before[n] for n in untouched),
      'appliedFileHashesMatch':not a.apply or all(sha((root/n).read_bytes())==sha(b) for n,b in mutations.items()),
      'stagedFileHashesMatch':all(sha((run/'patch-staging/game'/r['path']).read_bytes())==r['sha256'] for r in selected),
      'currentSelectedWorkHashesMatch':all(sha((game/r['path']).read_bytes())==r['sha256'] for r in selected),
      'rawLedgerEventCount':len(events),'rawPostBaselineEventCount':len(post)}
    if not all(v for k,v in summary['verification'].items() if isinstance(v,bool)):
        raise RuntimeError('Verification failed; inspect retained prepared run')
    for n in mutations:
        exclusive(run/'metadata-after'/n,(root/n).read_bytes() if a.apply else mutations[n])
    exclusive(run/'SYNC_RESULT.json',jb(summary))
    if a.apply:
        index=root/'image_work/release-history/index.json'
        old_index=index.read_bytes() if index.exists() else None
        ix=json.loads(old_index.decode('utf-8-sig')) if old_index else {'version':1,'runs':[]}
        ix['runs'].append({'runId':runid,'createdUTC':summary['capturedUTC'],'summary':str(run/'SYNC_RESULT.json'),
          'summarySha256':sha((run/'SYNC_RESULT.json').read_bytes()),'ledgerWatermarkUTC':watermark})
        ix['latestRun']=runid
        if old_index: cas(index,old_index,jb(ix))
        else: exclusive(index,jb(ix))
    print(js({'status':summary['status'],'runDirectory':str(run),'counts':summary['counts'],'verification':summary['verification']}))

if __name__=='__main__':
    p=argparse.ArgumentParser(); p.add_argument('--game',required=True);p.add_argument('--catalog',required=True)
    p.add_argument('--baseline',required=True);p.add_argument('--baseline-sha',required=True)
    p.add_argument('--external',required=True);p.add_argument('--inventory',required=True);p.add_argument('--full',required=True)
    p.add_argument('--original',default='G:/somi/JO9O/game')
    p.add_argument('--apply',action='store_true'); main(p.parse_args())
