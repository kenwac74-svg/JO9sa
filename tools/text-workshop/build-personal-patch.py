"""Build an immutable, timestamped personal image patch from workshop provenance."""
import argparse, datetime as dt, hashlib, html, io, json, os, pathlib, zipfile
from PIL import Image, ImageOps

def digest(b): return hashlib.sha256(b).hexdigest()
def stamp(s):
    value=dt.datetime.fromisoformat(s.replace('Z','+00:00'))
    if value.tzinfo is None: raise ValueError('시각에 시간대(+09:00)를 넣어 주세요.')
    return value
def build(root, output, until, since=None, dry_run=False):
    root=pathlib.Path(root); end=stamp(until); start=stamp(since) if since else None
    events=[json.loads(s) for s in (root/'events.jsonl').read_text('utf-8').splitlines() if s.strip()]
    chosen={}; baseline={}; owned=set()
    for e in sorted(events,key=lambda x:(stamp(x['created']),x['key'])):
        t=stamp(e['created'])
        if t>end or (start and t<start): continue
        for f in e['files']:
            p=pathlib.PurePosixPath(f['path'])
            if p.is_absolute() or '..' in p.parts or '\\' in f['path'] or ':' in f['path']: raise ValueError('잘못된 파일 경로')
            key=f['path']
            if e['operation']=='relocate':
                source=f.get('fromPath'); prior=chosen.get(source)
                # Moving bytes transfers existing ownership; it never creates it.
                if prior and prior['after']==f['after']:
                    chosen.pop(source)
                    baseline[key]=baseline.get(source,f)
                    owned.add((key,f['after']))
                    chosen[key]={**prior,'path':key,'created':e['created'],'createdKST':e['createdKST'],'operation':'relocate'}
                continue
            baseline.setdefault(key,f)
            if e['operation']=='restore':
                # A restored hash is owned only if an earlier recorded user result had it.
                if (key,f['after']) not in owned: chosen.pop(key,None); continue
            else: owned.add((key,f['after']))
            chosen[key]={**f,'created':e['created'],'createdKST':e['createdKST'],'operation':e['operation']}
    if not chosen: raise ValueError('지정 기간에 확인된 작업 이미지가 없습니다.')
    blobs={}; rows=[]; thumbs={}; missing=[]
    # 12 MiB total thumbnail budget, deduplicated and never embedded as base64.
    budget=min(6000,max(1,(12*1024*1024)//(2*len(chosen))))
    def thumb(b):
        h=digest(b)
        if h in thumbs: return thumbs[h][0]
        with Image.open(io.BytesIO(b)) as original:
            original=ImageOps.exif_transpose(original).convert('RGBA')
            for edge in (160,128,96,64,32,16,8,1):
                im=original.copy();im.thumbnail((edge,edge))
                for quality in (60,40,20,1):
                    out=io.BytesIO();im.save(out,format='WEBP',quality=quality,method=6)
                    data=out.getvalue()
                    if len(data)<=budget:
                        name='thumbs/'+h+'.webp';thumbs[h]=(name,data);return name
        raise ValueError('썸네일 용량 한도를 맞출 수 없습니다.')
    for key,f in sorted(chosen.items()):
        object_path=root/'objects'/f['after']
        if object_path.is_file():
            b=object_path.read_bytes()
        else:
            settings=json.loads((root/'settings.json').read_text('utf-8-sig'))
            game=pathlib.Path(settings['game']).resolve()
            current=(game/'content'/'pic'/key).resolve()
            if not current.is_relative_to(game/'content'/'pic') or not current.is_file():
                raise ValueError('PC 이전 이미지가 아직 없습니다: '+key)
            b=current.read_bytes()
        if digest(b)!=f['after']: raise ValueError('보존 이미지 해시 오류: '+f['path'])
        dest='game/content/pic/'+f['path'];blobs[dest]=b;after=thumb(b);before=None
        old=baseline[key]; p=old.get('beforePath')
        try:
            if p and pathlib.Path(p).is_file():
                prior=pathlib.Path(p).read_bytes()
                if digest(prior)==old.get('before'): before=thumb(prior)
        except OSError: pass  # An unavailable comparison drive must not lose the user result.
        if not before: missing.append(f['path'])
        rows.append('<tr><td>'+html.escape(f['path'])+'<br>'+html.escape(f['createdKST'])+'</td><td>'+(('<img loading="lazy" src="'+before+'">') if before else '비교 원본 없음 / 추가 컷')+'</td><td><a href="../'+html.escape(dest,quote=True)+'"><img loading="lazy" src="'+after+'"></a></td></tr>')
    manifest={'version':1,'since':since,'until':until,'built':dt.datetime.now(dt.timezone.utc).isoformat(),'files':[{k:v for k,v in f.items() if k!='beforePath'} for f in chosen.values()],'count':len(chosen),'thumbnailBytes':sum(len(v[1]) for v in thumbs.values()),'comparisonMissing':missing,'note':'기록으로 확인된 개인 작업만 포함. 원본 B컷 링크와 게임 실행 파일은 포함하지 않음.'}
    page='<!doctype html><meta charset="utf-8"><title>개인 이미지 패치 대조</title><style>body{font:14px sans-serif;background:#222;color:#eee}td{padding:8px;border-bottom:1px solid #555}img{max-width:160px;max-height:160px;background:#555}input{padding:8px}</style><h1>개인 이미지 패치 대조</h1><p>'+html.escape(until)+'까지 · '+str(len(chosen))+'개 · 교체 직전 / 작업 결과</p><input placeholder="파일명 검색" oninput="document.querySelectorAll(\'tbody tr\').forEach(r=>r.hidden=!r.cells[0].textContent.toLowerCase().includes(this.value.toLowerCase()))"><table><thead><tr><th>파일 / 작업 시각</th><th>작업 전</th><th>작업 결과</th></tr></thead><tbody>'+''.join(rows)+'</tbody></table>'
    manifest['catalogBytes']=manifest['thumbnailBytes']+len(page.encode('utf-8'))
    manifest['imageBytes']=sum(len(b) for b in blobs.values())
    if dry_run:return manifest
    output=pathlib.Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    try:
        with zipfile.ZipFile(output,'x',zipfile.ZIP_DEFLATED) as z:
            z.writestr('manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
            z.writestr('catalog/index.html',page)
            z.writestr('설치안내.txt','ZIP의 game 폴더 안 내용을 게임의 game 폴더에 덮어쓰세요. 기존 이미지 백업을 권장합니다.\n컷 전환 기능과 원본 B컷 링크 설정은 이 이미지 전용 패치에 포함되지 않습니다.\n대조 카탈로그는 catalog/index.html을 여세요.')
            for name,b in blobs.items(): z.writestr(name,b)
            for name,b in thumbs.values(): z.writestr('catalog/'+name,b)
    except Exception:
        # Never delete an existing archive on a refused overwrite.
        raise
    return manifest
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--output',default='personal-image-patch.zip');p.add_argument('--until',required=True);p.add_argument('--since');p.add_argument('--dry-run',action='store_true');a=p.parse_args()
    result=build(a.root,a.output,a.until,a.since,a.dry_run)
    print(json.dumps({k:v for k,v in result.items() if k not in ('files','comparisonMissing')},ensure_ascii=False))
