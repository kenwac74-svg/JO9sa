"""Exclude the one verified development-only shell validator from Full.
WORK retains its utility; no game paths or references change.
"""
import json
from operations import HERE,WORK,FULL,archive_file,sha
def load(n):return json.loads((HERE/n).read_text(encoding='utf-8'))
def write(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
rel='game/json/slaves/check_json.sh';digest='7b0f06715b1e03a1eaab7d077f9e8300185a34a90b27a953dd13ac4e511df704'
assert sha(WORK/rel)==sha(FULL/rel)==digest
archive_file(FULL/rel,'release-unused/'+rel,'Verified Bash-only JSON validation utility; no runtime/tool caller. WORK utility retained.',digest)
w=load('hashes-work.json');row=next(r for r in w['files'] if r['path']==rel)
w['files'].remove(row);w['excluded'].append({**row,'reason':'development-only-json-validation-script'})
w['bytes']-=row['bytes'];w['count']-=1;write(HERE/'hashes-work.json',w)
r=load('runtime-verification.json');r['files']=[v for v in r['files'] if v['path']!=rel];r['runtimeFiles']-=1;r['runtimeBytes']-=row['bytes']
r['postVerificationExclusions']=[{'path':rel,'bytes':row['bytes'],'sha256':digest,'reason':'Development-only utility, no runtime reader; remaining verified bytes unchanged'}]
write(HERE/'runtime-verification.json',r)
text=(HERE/'VALIDATION_KO.md').read_text(encoding='utf-8').replace('42,927','42,926')
archive_file(FULL/'VALIDATION_KO.md','full-before-hygiene/VALIDATION_KO.md','This task verification count corrected after release-only utility exclusion')
for p in [HERE/'VALIDATION_KO.md',FULL/'VALIDATION_KO.md']:p.write_text(text,encoding='utf-8')
manifest=load('BUILD_MANIFEST.json');manifest['files']=[v for v in manifest['files'] if v['path']!=rel]
manifest['runtimeFiles']-=1;manifest['payloadFilesExcludingManifest']-=1;manifest['payloadBytesExcludingManifest']-=row['bytes']
for v in manifest['files']:
    if v['path']=='VALIDATION_KO.md':
        delta=(FULL/v['path']).stat().st_size-v['bytes'];manifest['payloadBytesExcludingManifest']+=delta;v['bytes']+=delta;v['sha256']=sha(FULL/v['path'])
archive_file(FULL/'BUILD_MANIFEST.json','full-before-hygiene/BUILD_MANIFEST.json','This task content manifest before excluding verified release-only validator')
for p in [HERE/'BUILD_MANIFEST.json',FULL/'BUILD_MANIFEST.json']:write(p,manifest)
report=(HERE/'REPORT_KO.md').read_text(encoding='utf-8').replace('42,927','42,926').replace('16,827,193,418','16,827,193,345')
report+='\n최종 배포 위생 검사에서 게임 호출이 없는 Bash JSON 검증 도구 check_json.sh(73바이트) 한 개를 Full에서 K:/doing/JO9_trash/full-prezip-20261101/release-unused로 보관 이동했다. WORK의 개발용 원본은 유지했다. 그 외 실행 설정·라이선스·이미지 인덱스는 파일명만 보고 제외하지 않았다.\n'
(HERE/'REPORT_KO.md').write_text(report,encoding='utf-8')
write(HERE/'release-hygiene-result.json',{'excludedFiles':1,'excludedBytes':73,'workUtilityPreserved':sha(WORK/rel)==digest,'runtimePathsReorganized':False,'runtimeFiles':manifest['runtimeFiles']})
print('Release-only validator archived; WORK utility retained; manifest and count updated.')
