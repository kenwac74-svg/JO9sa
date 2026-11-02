from pathlib import Path
import os,json,hashlib,shutil,datetime
F=Path('G:/somi/Jack O Nine Tails v2.4 Kor_Full').resolve()
R=Path('G:/somi/JO9sa/records/distribution-cleanup-20261102');R.mkdir(parents=True,exist_ok=True)
stamp=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9))).strftime('%Y%m%d_%H%M%S')
A=Path('K:/doing/JO9_trash')/('distribution-cleanup-'+stamp)
remove=['ARTWORK_PENDING_KO.md','BUILD_MANIFEST.json','CHANGELOG_KO.md','PLAYTEST_KO.md','VALIDATION_KO.md','게임 실행.cmd']
remove+=['game/save/'+n for n in ['TC_01_HOME_TRAITS.sav','TC_02_CATFIGHT_INTRO.sav','TC_03_CATFIGHT_VICTORY.sav','TC_04_AGRABAH_FRUIT.sav','TC_05_BANKRUPTCY_CHAIN.sav','TC_06_FOG_GROUP.sav','TC_07_EGEYA_EVENT.sav','TC_08_AUCTION_DIFFICULTY.sav','TC_09_PORTAL_GUARDIAN_EVENT.sav','TC_10_VATICAN_PALADIN_EVENT.sav']]
remove+=['game/content/pic/bg/interiors/trophy/Trophy.pngbk','game/content/pic/bg/trophy/Trophy.pngbk','game/content/pic/girls/torture_scenes/jack-sheet.ods','game/content/pic/reserve/jo9mod/manifest.csv','game/json/slaves/check_json.sh']
def safe(rel):
 p=F/rel
 assert p.resolve().is_relative_to(F) and p!=F
 for q in [p]+list(p.parents):
  assert not(q.lstat().st_file_attributes & 0x400),str(q)
  if q==F:break
 return p
def sha(p):
 with p.open('rb') as s:return hashlib.file_digest(s,'sha256').hexdigest()
qsp=sha(F/'game/jack.qsp');old=json.loads((F/'BUILD_MANIFEST.json').read_text(encoding='utf8'))
plan=[]
for rel in remove:
 p=safe(rel);assert p.is_file(),rel
 plan.append({'path':rel,'bytes':p.stat().st_size,'sha256':sha(p),'reason':'internal-release-metadata-or-test' if rel in remove[:16] else 'unreferenced-working-artifact'})
assert shutil.disk_usage(A.parent).free>sum(x['bytes'] for x in plan)+2000000
A.mkdir(parents=True,exist_ok=False)
(R/'plan.json').write_text(json.dumps({'root':str(F),'archive':str(A),'qspSha256':qsp,'rows':plan},ensure_ascii=False,indent=2),encoding='utf8')
results=[]
for row in plan:
 p=safe(row['path']);dst=A/row['path'];dst.parent.mkdir(parents=True,exist_ok=True)
 assert sha(p)==row['sha256'];shutil.copy2(p,dst);assert sha(dst)==row['sha256'];p.unlink();assert not p.exists();results.append(row)
 (R/'progress.json').write_text(json.dumps({'archive':str(A),'removed':results},ensure_ascii=False,indent=2),encoding='utf8')
readme=safe('README_KO.txt');original=readme.read_text(encoding='utf8');shutil.copy2(readme,A/'README_KO.before.txt')
text=original.replace(' 게임 실행.cmd는 필요할 때 사용할 수 있는 보조 실행 파일입니다.','')
text='\n'.join(line for line in text.splitlines() if 'TC_01~TC_10' not in line and 'PLAYTEST_KO.md' not in line)+'\n'
readme.write_text(text,encoding='utf8')
assert sha(F/'game/jack.qsp')==qsp
kept=[x for x in old['files'] if x['path'] not in remove]
for row in kept:
 if row['path']=='README_KO.txt':row.update(bytes=readme.stat().st_size,sha256=sha(readme))
# Internal release manifest stays outside the payload.
old.update(preparedUtc=datetime.datetime.now(datetime.timezone.utc).isoformat(),state='READY_TO_ZIP_CLEAN_PAYLOAD',publicTestSaves=0,payloadFilesExcludingManifest=len(kept),payloadBytesExcludingManifest=sum(x['bytes'] for x in kept),files=kept)
old['validation']['guiVisualPlaytest']='User verifies visuals in normal EXE; test saves remain in WORK, not public payload.'
old['runtimeFiles']-=5
(R/'BUILD_MANIFEST.json').write_text(json.dumps(old,ensure_ascii=False,indent=2),encoding='utf8')
result={'root':str(F),'removedFiles':len(results),'removedBytes':sum(x['bytes'] for x in results),'archive':str(A),'qspUnchanged':True,'qspSha256':qsp,'keptOriginalCuts':{'files':238,'bytes':162347987,'currentQspDirectReferences':0,'physicalBAliases':238,'identicalBAliases':237,'changedAlias':'characters/bishop_nerilis (2).png','reason':'Documented legacy path compatibility; current Windows B slots use pic paths; existing-save effect of removing legacy paths not validated; no path cleanup in this release.'},'rootRemaining':sorted(x.name for x in F.iterdir()),'publicTestSavesRemaining':len(list((F/'game/save').glob('*.sav'))),'zipCreated':False}
(R/'FINAL_RESULT.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf8')
(A/'RESTORE_MANIFEST.json').write_text(json.dumps({'root':str(F),'rows':results,'restore':'Copy each archived relative path to root only when absent; never overwrite existing files.'},ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(result,ensure_ascii=False))