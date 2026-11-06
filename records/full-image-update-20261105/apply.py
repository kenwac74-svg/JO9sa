from pathlib import Path,PurePosixPath
from PIL import Image
from datetime import datetime,timezone
import zipfile,hashlib,json,stat,io,os,subprocess

HERE=Path(__file__).resolve().parent;GAME=Path('G:/somi/Jack O Nine Tails v2.4_work/game');REPO=Path('G:/somi/JO9sa')
ARCHIVE=Path('C:/Users/User/AppData/Local/Temp/full.zip');BACKUP=Path('G:/Codex/tmp/full-image-update-20261105-before')
ID='FULL_IMAGE_PACK_20261105_934d07254738'
def sha(b):return hashlib.sha256(b).hexdigest()
def put(p,b):
 p.parent.mkdir(parents=True,exist_ok=True);t=p.with_name(p.name+'.full-pack.tmp');assert not t.exists();t.write_bytes(b);os.replace(t,p);assert p.read_bytes()==b
def main():
 qsp_before=sha((GAME/'jack.qsp').read_bytes());HERE.mkdir(exist_ok=True)
 raw=ARCHIVE.read_bytes();assert sha(raw)=='934d07254738a35185aa8fb17c7d74aa888ba8bd0ad9ed3fbd8e9621f8169599'
 base=GAME/'content/pic/girls/full';rows=[];payloads={};previous={};seen=set()
 with zipfile.ZipFile(ARCHIVE) as z:
  for entry in z.infolist():
   if entry.is_dir():continue
   rel=PurePosixPath(entry.filename)
   assert len(rel.parts)==1 and rel.suffix.lower()=='.png' and not rel.is_absolute() and '..' not in rel.parts and '\\' not in entry.filename and ':' not in entry.filename
   assert not stat.S_ISLNK(entry.external_attr>>16);key=entry.filename.casefold();assert key not in seen;seen.add(key)
   b=z.read(entry) # Includes CRC verification.
   with Image.open(io.BytesIO(b)) as im:assert im.size==(795,596) and im.mode=='RGBA';im.verify()
   p=base/entry.filename;assert p.parent.resolve()==base.resolve() and p.is_file()
   old=p.read_bytes();payloads[entry.filename]=b;previous[entry.filename]=old
   cid=int(entry.filename.split('_')[0]);j=GAME/f'json/slaves/{cid}.json';d=json.loads(j.read_text(encoding='utf-8-sig'))
   assert d['fullimage'].replace('\\','/')=='girls/full/'+entry.filename[:-4] and not d.get('indpack_title')
   rows.append({'path':'girls/full/'+entry.filename,'name':entry.filename,'characterId':cid,'before':sha(old),'after':sha(b),'bytes':len(b),'width':795,'height':596,'existed':True,'beforePath':str(BACKUP/entry.filename),'json':str(j.relative_to(GAME)),'jsonSha256':sha(j.read_bytes())})
 assert len(rows)==25
 BACKUP.mkdir(parents=True,exist_ok=True)
 for n,b in previous.items():assert not (BACKUP/n).exists();put(BACKUP/n,b)
 written=[]
 try:
  for n,b in payloads.items():
   assert (base/n).read_bytes()==previous[n],'Concurrent image change: '+n
   put(base/n,b);written.append(n)
 except Exception:
  for n in reversed(written):put(base/n,previous[n])
  raise
 for n,b in payloads.items():put(REPO/'assets/content/pic/girls/full'/n,b)
 record={'version':2,'id':ID,'created':datetime.now(timezone.utc).isoformat(),'status':'applied','operation':'replace','sourceArchive':str(ARCHIVE),'sourceSha256':sha(raw),'files':rows,'qspSha256':qsp_before,'fullTouched':False,'resizedOrCropped':False,'gameplayVerifiedByUser':False}
 (HERE/'manifest.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 rec=REPO/'records/full-image-update-20261105';put(rec/'manifest.json',(HERE/'manifest.json').read_bytes())
 # Use the existing personal image patch ledger, preserving its normal ownership/history semantics.
 script="const fs=require('fs');const r=JSON.parse(fs.readFileSync(process.argv[1]));const p=require('G:/somi/JO9sa/tools/text-workshop/personal-patch.cjs').create(process.argv[2],process.argv[3]);p.record(r,'replace');console.log('Personal image patch ledger recorded25files');"
 run=subprocess.run(['node','-e',script,str(HERE/'manifest.json'),str(GAME),str(GAME/'modtools/catalog')],capture_output=True,text=True)
 assert run.returncode==0,run.stderr
 runtime=REPO/'assets/runtime-source-2.4.1.json';d=json.loads(runtime.read_text(encoding='utf8'));mapping={x['runtimePath']:x for x in d['files']}
 for r in rows:
  rel='content/pic/'+r['path'];item={'runtimePath':rel,'repositoryPath':'assets/'+rel,'bytes':r['bytes'],'sha256':r['after']}
  if rel in mapping:mapping[rel].update(item)
  else:d['files'].append(item)
 put(runtime,(json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode())
 changelog=GAME.parent/'CHANGELOG_KO.md';text=changelog.read_text(encoding='utf-8-sig');entry='- 기존 캐릭터25종의 기본 전신 이미지를795×596 규격의 새 이미지로 교체했습니다.'
 assert entry not in text and '[신규 업데이트]' in text;text=text.replace('[신규 업데이트]','[신규 업데이트]\n'+entry,1);put(changelog,text.encode())
 text='# 캐릭터 기본 전신25장 교체\n\n사용자 full.zip을 WORK/content/pic/girls/full에 적용했다.1451~1462,2325~2332,2334~2338의 기존25개 PNG를 압축 안의 바이트 그대로 교체했다. 모두795×596 RGBA이며 별도 확대·축소·크롭은 하지 않았다. 기존 JSON의 기본 전신 경로와 모두 일치하며 indpack_title 우회 참조는 없다.\n\n개인 이미지 패치 원장에25파일의 이전/이후 해시·복구 경로를 등록했고, 추적 리소스와 차기 패치 manifest 및 WORK CHANGELOG_KO.md의 신규 업데이트 항목에 포함했다. QSP·JSON·세이브·배포 폴더는 변경하지 않았다. PNG 열림·규격·ZIP CRC·설치 후 해시를 확인했으며 실제 게임의 외형 육안 확인은 사용자 대기다. 이미지 체크리스트는 최신 파일 목록으로 갱신한다.\n'
 put(rec/'REPORT_KO.md',text.encode());put(rec/'apply.py',Path(__file__).read_bytes())
 bundle=REPO/'docs/SECOND_PATCH_WORK_BUNDLE_20261021.md';text=bundle.read_text(encoding='utf8');text+='\n\n## 2026-11-05 기본 전신 이미지25장 교체 — 차기 패치 포함\n\n사용자 full.zip의1451~1462/2325~2332/2334~2338 전신25장을 WORK에 적용했다. 모두795×596 RGBA, 원본 파일명/바이트 유지. 개인 이미지 패치 원장·추적 리소스·WORK 업데이트 항목에 등록했다. [파일별 기록](../records/full-image-update-20261105/manifest.json). QSP·JSON·Full·배포ZIP·커밋푸시 없음.\n';put(bundle,text.encode())
 handoff=REPO/'docs/SESSION_HANDOFF_INDEX.md';text=handoff.read_text(encoding='utf8');text+='\n\n## 2026-11-05 사용자 full.zip 전신25장 반영\n\n[반영 결과](../records/full-image-update-20261105/REPORT_KO.md). WORK girls/full의25개795×596 RGBA를 교체하고 개인 패치 원장·추적 PNG·다음 패치 업데이트 항목에 등록했다. QSP·JSON·Full 불변.\n';put(handoff,text.encode())
 assert sha((GAME/'jack.qsp').read_bytes())==qsp_before
 for r in rows:
  assert sha((GAME/'content/pic'/r['path']).read_bytes())==r['after']
  assert sha((GAME/r['json']).read_bytes())==r['jsonSha256']
 print(json.dumps({'installed':25,'all795x596':True,'allRGBA':True,'ledgerRecorded':True,'updateEntryAdded':True,'qspUnchanged':True,'jsonUnchanged':True,'fullTouched':False},indent=2))
if __name__=='__main__':main()
