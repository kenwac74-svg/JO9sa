"""Change the verified core ZIP's QSP only; preserve CSS, JSON, utility and image packs."""
from pathlib import Path
import hashlib,json,zipfile,shutil,datetime as dt
REPO=Path('G:/somi/JO9sa');REC=REPO/'records/peerless-display-rename-20261021'
TMP=Path('G:/Codex/tmp/peerless-display-rename-20261021')
OUT=Path('G:/somi/JO9_2.4_SecondPatch_20261021_Split')
BASE=Path('G:/somi/JO9_2.4_Release_20261019_Final/verified/JO9_2.4_Full/game')
load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda b:hashlib.sha256(b).hexdigest()
dump=lambda x:(json.dumps(x,ensure_ascii=False,indent=2)+'\n').encode('utf-8')
previous=load(REPO/'records/second-patch-json-r2-20261021/FINAL_RESULT.json')
build=load(REC/'BUILD_RESULT.json');prior=next(x for x in previous['artifacts'] if x['kind']=='core')
assert sha(Path(prior['archive']).read_bytes())==prior['sha256']
qsp=(TMP/'candidate/jack.qsp').read_bytes();assert sha(qsp)==build['after']
archive=OUT/'JO9_2.4_SecondPatch_20261021_Core_Test_r3.zip';assert not archive.exists()
with zipfile.ZipFile(prior['archive']) as z:members={n:z.read(n) for n in z.namelist()}
assert sha(members['game/jack.qsp'])==build['before']
before_members={n:sha(b) for n,b in members.items()}
members['game/jack.qsp']=qsp
manifest_name=next(n for n in members if n.startswith('BUILD_MANIFEST_'))
manifest=json.loads(members.pop(manifest_name));manifest['revision']='r3-peerless-display-name';manifest['gamePayloadUnchanged']=False
manifest['changedGameFiles']=['game/jack.qsp'];manifest['createdAt']=dt.datetime.now(dt.timezone.utc).isoformat()
for r in manifest['runtimeFiles']:
 if r['path']=='game/jack.qsp':r.update(sha256=build['after'],bytes=len(qsp))
members['BUILD_MANIFEST_CORE_r3.json']=dump(manifest)
for n in list(members):
 if not(n.startswith('README_') or n=='CHANGELOG_KO.md'):continue
 text=members[n].decode('utf-8-sig').replace('\r\n','\n')
 text=text.replace('JO9_2.4_SecondPatch_20261021_Core_Test_r2.zip',archive.name)
 text=text.replace('2차 누적 본체 테스트 패치 r2','2차 누적 본체 테스트 패치 r3')
 text+='\n본체 r3: QSP 표시명 경국지색을 절세미인으로 통일했습니다. 저장 키·특성 효과·CSS·JSON·이미지팩·삭제기는 변경하지 않았습니다.\n'
 new_name=n.replace('_r2_','_r3_');members.pop(n);members[new_name]=text.replace('\n','\r\n').encode('utf-8-sig')
unchanged=[n for n in before_members if n.startswith('game/') and n!='game/jack.qsp']+['Remove-Old-Dona-Json.ps1','Remove-Old-Dona-Json.cmd','dona-json-delete-allowlist.json','REMOVE_OLD_DONA_JSON_KO.txt']
assert all(sha(members[n])==before_members[n] for n in unchanged)
with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for n,b in members.items():z.writestr(n,b)
with zipfile.ZipFile(archive) as z:
 assert len(z.namelist())==len(set(n.casefold() for n in z.namelist()))==len(members)
 assert set(z.namelist())==set(members)
 for n in members:assert sha(z.read(n))==sha(members[n])
 h=sha(archive.read_bytes());(OUT/(archive.name+'.sha256')).write_text(h+'  '+archive.name+'\n',encoding='ascii')
 game=TMP/'core-runtime/game';assert not game.exists();shutil.copytree(BASE/'json',game/'json');shutil.copyfile(BASE/'config.xml',game/'config.xml')
 for r in manifest['runtimeFiles']:
  p=game/r['path'][5:];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(r['path']))
 deletes=load(REPO/'records/seed-namespace-fix-20261020/runtime-delta.json')['delete_runtime_files']
 for d in deletes:
  p=game/d['file'];assert sha(p.read_bytes())==d['only_if_sha256'];p.unlink()
protected=[]
for x in previous['artifacts']:
 if x['kind']=='core':continue
 p=Path(x['archive']);s=p.stat();protected.append({'path':str(p),'bytes':s.st_size,'mtimeNs':s.st_mtime_ns,'sha256':x['sha256']})
work=Path('G:/somi/Jack O Nine Tails v2.4_work/game');full=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full/game')
for p in [work/'css/base.css',work/'json/slaves/211.json',full/'jack.qsp']:
 s=p.stat();protected.append({'path':str(p),'bytes':s.st_size,'mtimeNs':s.st_mtime_ns,'sha256':sha(p.read_bytes())})
result={'status':'PACKAGED_NOT_APPLIED_QA_PENDING','core':{'kind':'core','archive':str(archive),'bytes':archive.stat().st_size,'sha256':h,'runtimeFiles':3,'counts':{'qsp':1,'css':1,'json':1}},
 'before':build['before'],'after':build['after'],'onlyChangedRuntime':'game/jack.qsp','unchangedMembers':unchanged,'allZipCRCandSHA256':True,'protected':protected,
 'recovery':{'archive':prior['archive'],'archiveSha256':prior['sha256'],'member':'game/jack.qsp','sha256':build['before']},'otherPacksUnchanged':True,'FullUpdated':False,'commit':False,'push':False}
(REC/'PACKAGE_RESULT.json').write_bytes(dump(result));print(json.dumps(result))
