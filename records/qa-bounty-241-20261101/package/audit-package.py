"""Read-only distribution audit. Writes reports only in this script's directory.

No engine invocation, package changes, private save reads, or resource pruning.
"""
from __future__ import annotations
import collections
import concurrent.futures
import datetime as dt
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import struct
import time
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
ROOT = Path(r"G:/somi/Jack O Nine Tails v2.4 Kor_Full")
REPO = Path(r"G:/somi/JO9sa")

def load(p):
    return json.loads(p.read_text(encoding="utf-8-sig"))

def digest(p):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def rel(p):
    return p.relative_to(ROOT).as_posix()

def pe_imports(p):
    """Parse PE import and delay-import names without loading executables."""
    b = p.read_bytes()
    if b[:2] != b"MZ":
        return {"error": "not PE"}
    pe = struct.unpack_from("<I", b, 0x3c)[0]
    if b[pe:pe+4] != b"PE\0\0":
        return {"error": "invalid PE signature"}
    machine, sections = struct.unpack_from("<HH", b, pe+4)
    optional_size = struct.unpack_from("<H", b, pe+20)[0]
    opt = pe + 24
    magic = struct.unpack_from("<H", b, opt)[0]
    directory = opt + (112 if magic == 0x20b else 96)
    imagebase = struct.unpack_from("<Q" if magic == 0x20b else "<I", b, opt + (24 if magic == 0x20b else 28))[0]
    section_data = []
    for n in range(sections):
        off = opt + optional_size + 40*n
        vs, va, size, raw = struct.unpack_from("<IIII", b, off+8)
        section_data.append((va, max(vs,size), raw))
    def fileoff(rva):
        for va, size, raw in section_data:
            if va <= rva < va+size:
                return raw+rva-va
        if rva < len(b): return rva
        raise ValueError(f"invalid RVA {rva}")
    def string(rva):
        start=fileoff(rva)
        return b[start:b.index(0,start)].decode("ascii")
    imports=[]
    for di, step in ((1,20),(13,32)):
        rva,size=struct.unpack_from("<II",b,directory+8*di)
        if not rva: continue
        off=fileoff(rva)
        while off+step <= len(b) and any(b[off:off+step]):
            if di==1:
                name=struct.unpack_from("<I",b,off+12)[0]
            else:
                attributes,name=struct.unpack_from("<II",b,off)
                if not attributes & 1: name-=imagebase
            imports.append({"name":string(name),"kind":"normal" if di==1 else "delay"})
            off+=step
    return {"machine":hex(machine),"bits":64 if magic==0x20b else 32,"imports":imports}

start=time.monotonic()
manifest_path=ROOT/"BUILD_MANIFEST.json"
manifest=load(manifest_path)
manifest_before=digest(manifest_path)
files=[]
reparse=[]
for directory, dirs, names in os.walk(ROOT, followlinks=False):
    dp=Path(directory)
    for name in list(dirs):
        p=dp/name
        if p.lstat().st_file_attributes & 0x400:
            reparse.append(rel(p)); dirs.remove(name)
    for name in names:
        p=dp/name
        if p.lstat().st_file_attributes & 0x400:
            reparse.append(rel(p)); continue
        files.append(p)
payload={rel(p):p for p in files if p != manifest_path}
entries=manifest["files"]
paths=[e["path"] for e in entries]
unsafe=[]
for path in paths:
    pure=PurePosixPath(path)
    if pure.is_absolute() or ".." in pure.parts or "\\" in path or ":" in path or path.startswith("/"):
        unsafe.append(path)
duplicates=[p for p,n in collections.Counter(paths).items() if n>1]
casegroups=collections.defaultdict(list)
for p in paths: casegroups[p.casefold()].append(p)
casecollisions=[g for g in casegroups.values() if len(g)>1]
expected={e["path"]:e for e in entries}
missing=sorted(set(expected)-set(payload))
unexpected=sorted(set(payload)-set(expected))
size_mismatches=[]
changed=[]
hashes={}
done=0
def hash_item(item):
    name,p=item
    before=p.stat()
    actual=digest(p)
    after=p.stat()
    return name,actual,before.st_size,before.st_mtime_ns,after.st_size,after.st_mtime_ns
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for name,actual,size,mtime,size2,mtime2 in pool.map(hash_item,sorted(payload.items())):
        hashes[name]=actual
        entry=expected.get(name)
        if entry and size!=entry["bytes"]: size_mismatches.append({"path":name,"expected":entry["bytes"],"actual":size})
        if entry and actual!=entry["sha256"]: changed.append({"path":name,"expected":entry["sha256"],"actual":actual})
        if (size,mtime)!=(size2,mtime2): changed.append({"path":name,"error":"changed while hashing"})
        done+=1
        if done%5000==0: print(f"SHA256 {done}/{len(payload)}",flush=True)
manifest_after=digest(manifest_path)
stat_total=sum(p.stat().st_size for p in payload.values())
extensions=dict(collections.Counter(p.suffix.lower() for p in files))
save_names=sorted(n for n in payload if n.startswith("game/save/"))
public_saves=[f"game/save/TC_{i:02d}_{name}.sav" for i,name in enumerate(("HOME_TRAITS","CATFIGHT_INTRO","CATFIGHT_VICTORY","AGRABAH_FRUIT","BANKRUPTCY_CHAIN","FOG_GROUP","EGEYA_EVENT"),1)]

required=["게임 실행.cmd","Jack-o-nine-tails.exe","FastQSP.ini","game/FastQSP.ini","game/config.xml","game/icon.ico","game/jack.qsp","game/engine/jack.exe","game/engine/platforms/qwindows.dll","game/engine/Qt5Core.dll","game/engine/Qt5Gui.dll","game/engine/Qt5Widgets.dll","game/engine/Qt5WebKit.dll","game/engine/Qt5WebKitWidgets.dll","game/engine/imageformats/qjpeg.dll","game/engine/imageformats/qgif.dll","game/css/base.css","game/css/mainScreen.css","game/css/jo9_traits_view.css","game/content/js/jo9_word_wrap.js","game/content/js/jo9_traits_view.js","game/content/js/jo9_battle_log.js","LICENSES/NotoSerifCJK-OFL.txt","LICENSES/NotoSerifCJK-NOTICE.txt"]
required_missing=[n for n in required if n not in payload]
config_bytes=(ROOT/"game/config.xml").read_bytes()
config_text=config_bytes.decode("utf-16" if config_bytes.startswith((b"\xff\xfe",b"\xfe\xff")) else "utf-8-sig")
config=dict(re.findall(r'(\w+)="([^"]*)"',config_text))
try:
    ET.fromstring(config_text)
    strict_xml_note=None
except ET.ParseError as error:
    strict_xml_note={"result":"not strict XML","error":str(error),"classification":"FORMAT_NOTE_NOT_CONFIRMED_RUNTIME_DEFECT","reason":"Literal ampersand is retained in the window title. Repository ENGINE_SOURCE_SURVEY_20261014.md documents a regex-based title reader; native behavior was not rerun in this package audit."}
launcher=(ROOT/"게임 실행.cmd").read_text(encoding="utf-8-sig")
launcher_checks={"setsGameWorkingDirectory":'cd /d "%~dp0game" || exit /b 1' in launcher,"quotedEngine":'"%~dp0game\\engine\\jack.exe"' in launcher,"quotedQsp":'"%~dp0game\\jack.qsp"' in launcher,"explicitStartDirectory":'/d "%~dp0game"' in launcher}
font_paths=sorted(n for n in payload if n.startswith("game/fonts/"))
font_headers=[]
for n in font_paths:
    with payload[n].open("rb") as f: magic=f.read(4)
    font_headers.append({"path":n,"recognizedHeader":magic in (b"\0\1\0\0",b"OTTO",b"ttcf",b"true")})

css_refs=[]
external_refs=[]
for n,p in payload.items():
    if n.startswith("game/css/") or n.startswith("game/content/js/"):
        text=p.read_text(encoding="utf-8-sig")
        if p.suffix.lower()==".css":
            text=re.sub(r"/\*.*?\*/",lambda m:re.sub(r"[^\n]"," ",m.group()),text,flags=re.S)
        if p.suffix.lower()==".css":
            for match in re.finditer(r"url\(\s*['\"]?([^)'\"\s]+)['\"]?\s*\)",text):
                uri=match.group(1)
                if re.match(r"(?:https?:|file:|//|data:)",uri,re.I):
                    external_refs.append({"path":n,"uri":uri}); continue
                target=(p.parent/uri).resolve() if uri.startswith(".") else ROOT/"game"/uri
                css_refs.append({"path":n,"uri":uri,"resolved":str(target),"exists":target.is_file(),"line":text.count("\n",0,match.start())+1})
        for match in re.finditer(r"(?<![A-Za-z0-9_$])(?:https?://|file://|(?:localhost|127\.0\.0\.1):\d+|[A-Za-z]:[\\/])[^\s\"'<>]*",text):
            external_refs.append({"path":n,"uri":match.group(),"line":text.count("\n",0,match.start())+1})
engine_dependencies=[]
unresolved=[]
all_engine={p.name.casefold():p for n,p in payload.items() if n.startswith("game/engine/")}
system_dirs=[Path(os.environ.get("WINDIR",r"C:\Windows"))/name for name in ("SysWOW64","System32")]
for n,p in payload.items():
    if n.startswith("game/engine/") and p.suffix.lower() in (".dll",".exe"):
        row={"path":n,**pe_imports(p)}
        for dep in row.get("imports",[]):
            dn=dep["name"]
            if dn.casefold() in all_engine: dep["resolution"]="bundled"
            elif dn.lower().startswith(("api-ms-win-","ext-ms-win-")): dep["resolution"]="Windows API set"
            elif any((d/dn).is_file() for d in system_dirs): dep["resolution"]="Windows system DLL on audit host"
            else: dep["resolution"]="UNRESOLVED";unresolved.append({"importer":n,**dep})
        engine_dependencies.append(row)

aliases=load(REPO/"assets/compatibility-aliases/2026-10-28_fullimage.json")
alias_rows=[]
for e in aliases["files"]:
    names=["game/"+e["source"],"game/"+e["compatibility"]]
    alias_rows.append({"id":e["id"],"paths":names,"bothPresent":all(n in payload for n in names),"recordedHashMatches":all(hashes.get(n)==e["sha256"] for n in names),"sourceEqualsAlias":hashes.get(names[0])==hashes.get(names[1])})
full_compat=load(REPO/"records/full-prezip-20261101/full-extra-paths.json")
full_compat_rows=[{"path":e["path"],"present":e["path"] in payload,"manifestMatches":e["path"] in expected and hashes.get(e["path"])==expected[e["path"]]["sha256"]} for e in full_compat]
ui_alias_manifest=Path(r"G:/somi/Jack O Nine Tails v2.4_work/game/modtools/ui-resource-aliases.json")
ui_aliases=load(ui_alias_manifest)
ui_alias_rows=[]
for e in ui_aliases["aliases"]:
    names=["game/"+e["old"],"game/"+e["canonical"]]
    ui_alias_rows.append({"paths":names,"bothPresent":all(n in payload for n in names),"bothRecordedHash":all(hashes.get(n)==e["sha256"] for n in names),"pairEquals":hashes.get(names[0])==hashes.get(names[1])})
dev_suffix={".ps1",".py",".cjs",".mjs",".sh",".log",".tmp",".map",".ts",".zip",".7z",".rar",".pdb",".db",".sqlite"}
dev_candidates=sorted(n for n,p in payload.items() if p.suffix.lower() in dev_suffix or re.search(r"(?:^|/)(?:\.git|node_modules|backup|backups)(?:/|$)",n,re.I))
unusual=[n for n,p in payload.items() if p.suffix.lower() in (".pngbk",".ods",".csv")]
bad_names=[n for n in payload if any(re.search(r'[<>:"|?*]|[ .]$',part) or re.match(r'^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)',part,re.I) for part in n.split("/"))]
long_paths=sorted(((len(str(ROOT/n)),n) for n in payload),reverse=True)[:10]
result={
    "schema":1,"checkedUtc":dt.datetime.now(dt.timezone.utc).isoformat(),"kind":"READ_ONLY_PACKAGE_INTEGRITY_QA","full":str(ROOT),
    "verdict":"PASS" if not (missing or unexpected or size_mismatches or changed or unsafe or duplicates or casecollisions or reparse or required_missing or bad_names or manifest_before!=manifest_after) else "FAIL",
    "manifest":{"sha256":manifest_after,"unchangedDuringAudit":manifest_before==manifest_after,"preparedUtc":manifest["preparedUtc"],"qspExpected":manifest["qspSha256"],"qspActual":hashes["game/jack.qsp"],"expectedFiles":len(entries),"actualPayloadFiles":len(payload),"actualAllFiles":len(files),"expectedPayloadBytes":manifest["payloadBytesExcludingManifest"],"actualPayloadBytes":stat_total,"unsafePaths":unsafe,"duplicatePaths":duplicates,"caseCollisions":casecollisions,"missing":missing,"unexpected":unexpected,"sizeMismatches":size_mismatches,"sha256Mismatches":changed},
    "reparsePoints":reparse,"invalidWindowsNames":bad_names,"longestOriginalAbsolutePaths":long_paths,"extensions":extensions,
    "requiredRuntime":{"checked":len(required),"missing":required_missing,"config":config,"strictXmlFormatNote":strict_xml_note,"launcherStaticChecks":launcher_checks,"fontCount":len(font_paths),"fontHeaderFailures":[r for r in font_headers if not r["recognizedHeader"]],"cssUrlOccurrences":len(css_refs),"cssMissing":[r for r in css_refs if not r["exists"]],"externalCssJsCandidates":external_refs,"peFilesChecked":len(engine_dependencies),"unresolvedPeImports":unresolved},
    "publicSaves":{"expected":public_saves,"actual":save_names,"exactSet":save_names==sorted(public_saves),"freshManifestHashMatches":all(hashes.get(n)==expected[n]["sha256"] for n in public_saves)},
    "compatibility":{"intentionalFullimageAliasCount":len(alias_rows),"fullimageAliasFailures":[r for r in alias_rows if not r["bothPresent"] or not r["recordedHashMatches"]],"uiAliasManifest":str(ui_alias_manifest),"uiAliasManifestSha256":digest(ui_alias_manifest),"uiAliasPairs":len(ui_alias_rows),"uiAliasFailures":[r for r in ui_alias_rows if not r["bothPresent"] or not r["bothRecordedHash"] or not r["pairEquals"]],"fullOnlyNine":full_compat_rows,"noDeduplicationPerformed":True},
    "hygiene":{"developerCandidates":dev_candidates,"releaseOnlyValidatorAbsent":"game/json/slaves/check_json.sh" not in payload,"unusualExtensionsRetainedForReview":unusual},
    "limits":["No game engine was started; launcher inspection is static.","No fresh portable clean-machine run, GUI save loading, visual layout check, or interactive gameplay is claimed.","PE system-DLL resolution was inspected on this Windows audit host. It does not prove every target Windows version has the same optional multimedia/ODBC components.","CSS URLs use the observed package conventions: base.css content/ paths from game root, dot-relative URLs from the CSS directory. Engine DOM loading is covered only by historical checks, not this audit.","Only designated public TC save bytes were hashed; private save content was not opened.","No resource was classified unused from its name or duplicate hash. Compatibility aliases are required.","External dependency scan is bounded to packaged CSS and presentation JavaScript, not all dynamic QSP/JSON paths.","Long-path tolerance depends on final extraction location and archiver; original absolute path maximum is recorded."],
    "productionMutated":False,"engineStarted":False,"zipCreated":False,"elapsedSeconds":round(time.monotonic()-start,2)}
result["manifestIntegrityVerdict"]=result.pop("verdict")
result["packageReadinessVerdict"]="MANIFEST_PASS_WITH_STATIC_REFERENCE_CANDIDATE" if result["manifestIntegrityVerdict"]=="PASS" and result["requiredRuntime"]["cssMissing"] else result["manifestIntegrityVerdict"]
(HERE/"package-report.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(HERE/"runtime-dependencies.json").write_text(json.dumps({"pe":engine_dependencies,"css":css_refs,"fonts":font_headers,"aliases":alias_rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"verdict":result["packageReadinessVerdict"],"payloadFiles":len(payload),"bytes":stat_total,"sha256Mismatches":len(changed),"missing":len(missing),"unexpected":len(unexpected),"cssMissing":len(result["requiredRuntime"]["cssMissing"]),"unresolvedPeImports":len(unresolved),"uiAliasFailures":len(result["compatibility"]["uiAliasFailures"]),"elapsedSeconds":result["elapsedSeconds"]},ensure_ascii=False),flush=True)
