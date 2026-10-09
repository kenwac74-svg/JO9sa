from pathlib import Path
import zipfile,json,hashlib,shutil
root=Path(__file__).resolve().parents[1]
old=root/'backups/JO9_work_results_20261007_224701.zip'
new=root/'backups/JO9_work_results_20261007_224701_updated.zip'
final=Path(r'C:\MOVE\Jack O Nine Tails v2.3 Kor_nosex\game\content\modworkpic\e0d0278379173c6a981b62ef52e9a718 (1).jpg')
arc='results/completed-source/Voland-final.jpg'
def digest(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        while b:=f.read(4*1024*1024):h.update(b)
    return h.hexdigest()
with zipfile.ZipFile(old) as src,zipfile.ZipFile(new,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=1,allowZip64=True) as dst:
    m=json.loads(src.read('MANIFEST.json'))
    m['images']=[x for x in m['images'] if not x['path'].startswith('results/in-progress/Voland-variant-')]
    for info in src.infolist():
        if info.filename.startswith('results/in-progress/Voland-variant-') or info.filename in {'MANIFEST.json','집에서_이어하기.md'}:continue
        with src.open(info) as a,dst.open(info,'w',force_zip64=True) as b:shutil.copyfileobj(a,b,4*1024*1024)
    dst.write(final,arc,compress_type=zipfile.ZIP_STORED)
    m['images'].append({'path':arc,'bytes':final.stat().st_size,'sha256':digest(final),'status':'completed_by_user'})
    m['image_count']=len(m['images']);m['image_bytes']=sum(x['bytes'] for x in m['images'])
    m['voland_status']='사용자 완료 확인. 첨부 최종 JPG 추가. 기존 게임 적용 PNG·아이콘도 보존. 생성 시안 3개 제외.'
    note=src.read('집에서_이어하기.md').decode('utf-8').replace('results/in-progress: 이 대화에 첨부한 Voland 생성 시안. 최종 채택/게임 적용본이 아닙니다.','results/completed-source/Voland-final.jpg: 사용자가 완료 확인한 Voland 최종 원본 JPG. 기존 게임 적용 PNG·아이콘도 results/game에 보존했습니다. Voland 생성 시안 3개는 제외했습니다.')
    dst.writestr('집에서_이어하기.md',note)
    dst.writestr('MANIFEST.json',json.dumps(m,ensure_ascii=False,indent=2))
with zipfile.ZipFile(new) as z:
    assert z.testzip() is None
dest=Path(r'G:\내 드라이브\Moding\worksink').resolve()
assert str(dest).casefold()==r'G:\내 드라이브\Moding\worksink'.casefold()
target=dest/old.name
shutil.copyfile(new,target)
h=digest(new)
assert digest(target)==h
(dest/(old.name+'.sha256.txt')).write_text(h+'  '+old.name+'\n',encoding='ascii')
shutil.copyfile(new,old)
print(json.dumps({'images':m['image_count'],'MiB':round(target.stat().st_size/1048576,1),'final_source_bytes':final.stat().st_size,'verified':True},ensure_ascii=True))
