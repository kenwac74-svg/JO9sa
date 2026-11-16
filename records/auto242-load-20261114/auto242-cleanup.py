import pathlib,os,shutil,json,gzip
R=pathlib.Path('G:/somi/JO9sa');D=R/'records/auto242-load-20261114';S=pathlib.Path('G:/somi/JO9_2.4.2_Full_20261113/JO9_2.4.2_Kor_Full');T=pathlib.Path('G:/Codex/tmp/auto242-load-20261114');G=pathlib.Path('G:/Codex/tmp/auto242-gate-20261114');C=pathlib.Path.cwd();removed=[]
assert json.loads((D/'archive-verification.json').read_text('utf-8'))['verdict']=='PASS'
assert json.loads((D/'original-save-proof.json').read_text('utf-8'))['sourceStillUnchanged']
shutil.copy2(C/'auto242-cleanup.py',D/'auto242-cleanup.py')
for name in ['content','json','css','fonts']:
 p=T/'gui'/name
 if p.is_junction():
  assert p.resolve()==(S/'game'/name).resolve(),str(p)
  os.rmdir(p);assert (S/'game'/name).is_dir();removed.append(str(p))
def clear(root):
 assert root.resolve()==root and root.resolve().is_relative_to(pathlib.Path('G:/Codex/tmp').resolve()),str(root)
 stack=[root]
 while stack:
  for p in stack.pop().iterdir():
   assert not p.is_symlink() and not p.is_junction(),'Unexpected link '+str(p)
   if p.is_dir():stack.append(p)
 shutil.rmtree(root);removed.append(str(root))
for root in [T,G]:
 if root.exists():clear(root)
p=pathlib.Path('G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp.bak_20261114_095220')
if p.exists():
 assert p.read_bytes()==gzip.decompress((D/'baseline.qsp.gz').read_bytes())
 p.unlink();removed.append(str(p))
for p in C.glob('auto242-*'):
 if p.is_file() and p.suffix in {'.py','.cjs'}:
  assert (D/p.name).read_bytes()==p.read_bytes(),str(p)
  p.unlink();removed.append(str(p))
shots=C/'auto242-shots'
if shots.exists():
 for p in shots.iterdir():
  target=(D/p.name) if p.suffix=='.html' else pathlib.Path('G:/somi/JO9_2.4.2_Full_20261113/announcement-assets')/p.name
  assert target.read_bytes()==p.read_bytes(),str(p)
 shutil.rmtree(shots);removed.append(str(shots))
(D/'cleanup.json').write_text(json.dumps({'removed':removed,'originalSavePreserved':True,'oldReleaseZipPreserved':True,'stageResourcesPreserved':True,'retiredToolPreserved':True},ensure_ascii=False,indent=2),'utf-8')
print(json.dumps({'cleaned':len(removed),'temporarySavesAndFullExtractionRemoved':True}))
