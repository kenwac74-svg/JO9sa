"""Operational tests: real 25 old JSON + real 25 keep JSON, no arbitrary manifest seam."""
from pathlib import Path
import datetime, hashlib, json, shutil, subprocess, sys
sys.stdout.reconfigure(encoding="utf-8",errors="replace")

HERE=Path(__file__).resolve().parent
UTILITY=HERE/"utility"/"Remove-Old-Dona-Json.ps1"
ROWS=json.loads(Path(r"G:\somi\JO9sa\records\seed-namespace-fix-20261020\runtime-delta.json").read_text(encoding="utf-8-sig"))["delete_runtime_files"]
BASE=Path(r"G:\somi\JO9_2.4_Release_20261019_Final\verified\JO9_2.4_Full\game")
WORK=Path(r"G:\somi\Jack O Nine Tails v2.4_work\game")
RUN=Path(r"G:\Codex\tmp\second-patch-split-20261021\cleanup-tests")/datetime.datetime.now().strftime("run-%Y%m%d-%H%M%S-%f")
RESULTS=[]
LINKS=[]
RUN.mkdir(parents=True)
def check(value,why):
    if not value: raise AssertionError(why)
def fixture(name):
    root=RUN/name
    (root/"json/slaves").mkdir(parents=True)
    (root/"jack.qsp").write_bytes(b"")
    for row in ROWS:
        shutil.copyfile(BASE/row["file"],root/row["file"])
        shutil.copyfile(WORK/row["keep"],root/row["keep"])
    (root/"json/slaves/2577.json").write_text("quest-retain")
    (root/"json/slaves/2601_other.json").write_text("other-retain")
    return root
def run(root=None,mode=None,script=UTILITY):
    cmd=["powershell.exe","-NoLogo","-NoProfile","-NonInteractive","-ExecutionPolicy","Bypass","-File",str(script)]
    if root is not None: cmd+=["-GameDirectory",str(root)]
    if mode: cmd+=["-"+mode]
    return subprocess.run(cmd,capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=45)
def old_count(root,want):
    count=sum((root/r["file"]).exists() for r in ROWS)
    check(count==want,f"expected {want} old paths, got {count}")
def preserved(root):
    for row in ROWS:
        check(hashlib.sha256((root/row["keep"]).read_bytes()).hexdigest()==row["keep_sha256"],"keep changed "+row["keep"])
    check((root/"json/slaves/2577.json").read_text()=="quest-retain","same-number quest changed")
    check((root/"json/slaves/2601_other.json").read_text()=="other-retain","unrelated JSON changed")
def success(result):
    check(result.returncode==0,f"expected success, exit {result.returncode}: {result.stdout} {result.stderr}")
def rejected(result):
    check(result.returncode!=0,"unsafe input was accepted")
def junction(link,target):
    q=lambda p:"'"+str(p).replace("'","''")+"'"
    cmd="New-Item -ItemType Junction -Path "+q(link)+" -Target "+q(target)+" | Out-Null"
    subprocess.run(["powershell.exe","-NoProfile","-Command",cmd],check=True,capture_output=True)
    LINKS.append(link)
def utility_copy(where):
    where.mkdir(exist_ok=True)
    for name in ("Remove-Old-Dona-Json.ps1","dona-json-delete-allowlist.json"):
        shutil.copyfile(UTILITY.parent/name,where/name)
    return where/UTILITY.name
def canonical():
    g=fixture("canonical"); success(run(g)); old_count(g,0); preserved(g)
    success(run(g)); old_count(g,0); preserved(g)
def dry(mode):
    g=fixture(mode); success(run(g,mode)); old_count(g,25); preserved(g)
def partial():
    g=fixture("partial"); (g/ROWS[0]["file"]).unlink(); success(run(g)); old_count(g,0); preserved(g)
def tamper_old():
    g=fixture("bad-old"); p=g/ROWS[-1]["file"]; p.write_bytes(p.read_bytes()+b"changed")
    rejected(run(g)); old_count(g,25); preserved(g)
def bad_keep(tamper):
    g=fixture("bad-keep" if tamper else "missing-keep");p=g/ROWS[-1]["keep"]
    if tamper: p.write_bytes(p.read_bytes()+b"changed")
    else: p.unlink()
    rejected(run(g));old_count(g,25)
def absent_keep():
    g=fixture("absent-old")
    for r in ROWS:(g/r["file"]).unlink()
    (g/ROWS[-1]["keep"]).unlink();rejected(run(g))
def wrong():
    g=fixture("wrong");(g/"jack.qsp").unlink();rejected(run(g));old_count(g,25)
def directory_target():
    g=fixture("directory");p=g/ROWS[-1]["file"];p.unlink();p.mkdir();rejected(run(g));old_count(g,25)
def root_junction():
    g=fixture("root-target");link=RUN/"root-link";junction(link,g);rejected(run(link));old_count(g,25)
def parent_junction():
    g=fixture("parent-target/game");link=RUN/"parent-link";junction(link,g.parent)
    rejected(run(link/"game"));old_count(g,25)
def target_junction():
    g=fixture("link-target");p=g/ROWS[-1]["file"];p.unlink();ext=RUN/"external";ext.mkdir();(ext/"retain.txt").write_text("retain")
    junction(p,ext);rejected(run(g));old_count(g,25);check((ext/"retain.txt").read_text()=="retain","external target changed")
def auto_install():
    g=fixture("auto-install/game");script=utility_copy(g.parent);success(run(mode="DryRun",script=script));old_count(g,25)
def auto_game():
    g=fixture("auto-game");script=utility_copy(g);success(run(mode="DryRun",script=script));old_count(g,25)
def bad_list():
    g=fixture("bad-list");script=utility_copy(RUN/"bad-utility");p=script.parent/"dona-json-delete-allowlist.json"
    p.write_text(p.read_text(encoding="utf-8-sig").replace("2577_medico.json","2577.json"),encoding="utf-8")
    rejected(run(g,script=script));old_count(g,25);preserved(g)
def incomplete_auto():
    g=fixture("incomplete/game");script=utility_copy(g.parent)
    for row in ROWS:
        (g/row["file"]).unlink();(g/row["keep"]).unlink()
    rejected(run(mode="DryRun",script=script))
def cmd_launcher():
    g=fixture("한글 공백/game")
    command='cmd.exe /d /c ""'+str(UTILITY.with_suffix('.cmd'))+'" -GameDirectory "'+str(g)+'" -DryRun"'
    r=subprocess.run(command,input="\r\n",capture_output=True,text=True,encoding="utf-8",errors="replace",timeout=30)
    success(r);old_count(g,25);preserved(g)
TESTS=[
 ("canonical-removal-and-idempotence",canonical),("dry-run",lambda:dry("DryRun")),("what-if",lambda:dry("WhatIf")),
 ("partial-absence",partial),("tampered-old-atomic-refusal",tamper_old),("missing-keep-atomic-refusal",lambda:bad_keep(False)),
 ("tampered-keep-atomic-refusal",lambda:bad_keep(True)),("absent-old-validates-keep",absent_keep),("wrong-directory",wrong),
 ("old-path-is-directory",directory_target),("junction-root",root_junction),("junction-ancestor",parent_junction),
 ("junction-target",target_junction),("auto-install",auto_install),("auto-game",auto_game),("tampered-allowlist",bad_list),
 ("incomplete-extraction-not-auto-selected",incomplete_auto),("cmd-launcher-korean-spaces-dry-run",cmd_launcher)]
for name,action in TESTS:
    if len(sys.argv)>1 and sys.argv[1]!=name:continue
    try:action();RESULTS.append({"name":name,"passed":True,"reason":""});print("PASS "+name)
    except Exception as exc:RESULTS.append({"name":name,"passed":False,"reason":str(exc)});print("FAIL "+name+": "+str(exc))
# Remove only junction entries; never recurse into their targets.
for link in reversed(LINKS):
    check(link.is_junction(),"expected known test junction before unlink: "+str(link))
    link.rmdir()
failed=sum(not x["passed"] for x in RESULTS)
report={"status":"PASS" if not failed else "FAIL","timestamp":datetime.datetime.now().astimezone().isoformat(),
        "fixtureRoot":str(RUN),"runtime":"Windows PowerShell 5.1 via powershell.exe -File",
        "total":len(RESULTS),"passed":len(RESULTS)-failed,"failed":failed,"tests":RESULTS,
        "productionFiles":[{"name":p.name,"bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest()}
                           for p in sorted(UTILITY.parent.iterdir()) if p.is_file()]}
(HERE/"utility-test-result.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
print(f"RESULT {len(RESULTS)-failed}/{len(RESULTS)}; fixture root: {RUN}")
sys.exit(bool(failed))

