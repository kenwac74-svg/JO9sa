'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const core=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const game='G:/somi/Jack O Nine Tails v2.4_work/game';
const qsp=path.join(game,'jack.qsp'),raw=fs.readFileSync(qsp),doc=core.parse(raw);
const target=/\b(?:fullimage|fullmade|fullsecretary|fullmistress|fullpregnant|indpack_[a-z0-9_]+)\b/gi;
const audit={createdAt:new Date().toISOString(),qsp,qspSha:doc.hash,locationCount:doc.locations.length,scope:'Location descriptions/bodies and all compiled action fields; QSP decoded in memory only.',fieldCounts:{},locations:[],callsites:[],resolverCallers:[],dynamicLookupSites:[],extractedBlocks:[],fileSupportEvidence:[],writes:['audit.json'],sourceUnchanged:false};
function fieldScan(loc,field,text){
  const comments=core.literals(text,true).filter(x=>x.comment),lines=text.split(/\r?\n/);let offset=0;
  lines.forEach((line,index)=>{
    const matches=[...line.matchAll(target)];
    if(matches.length){
      const tokens=[...new Set(matches.map(m=>m[0].toLowerCase()))],comment=matches.every(m=>comments.some(c=>offset+m.index>=c.start-1&&offset+m.index<=c.end));
      for(const key of tokens){const counts=audit.fieldCounts[key]||(audit.fieldCounts[key]={activeLines:0,commentLines:0});counts[comment?'commentLines':'activeLines']++;}
      audit.callsites.push({location:loc.name,locationIndex:loc.index,field,line:index+1,classification:comment?'comment':loc.name==='slavebase_test'||/^\*?dev(?:_|$)|^#?dev(?:_|$)|debug|тест/i.test(loc.name)?'developer':'runtime',tokens,code:line,context:lines.slice(Math.max(0,index-2),Math.min(lines.length,index+3)).join('\n')});
    }
    if(/(?:func|gs)\s*\(?\s*['"]jo9_seed_role_images['"]/.test(line)&&!/^\s*!/.test(line))audit.resolverCallers.push({location:loc.name,field,line:index+1,code:line});
    if(loc.name==='display_fullimage'&&/\$outfit_(?:game|patch)|\$patch_(?:img_arr_name|mood_tagname|mood_image_path|image_path)|\$assistant_image_path/.test(line)&&!/^\s*!/.test(line))audit.dynamicLookupSites.push({location:loc.name,field,line:index+1,code:line});
    if(/dynamic\s+['"].*\bjo9_(?:exists|ic_path_exists)\s*=\s*%/.test(line))audit.fileSupportEvidence.push({location:loc.name,field,line:index+1,code:line});
    offset+=line.length+(text.includes('\r\n')?2:1);
  });
}
for(const loc of doc.locations){
  const before=audit.callsites.length;fieldScan(loc,'description',core.shift(doc.lines[loc.desc],5));fieldScan(loc,'body',core.shift(doc.lines[loc.body],5));
  const body=core.shift(doc.lines[loc.body],5).split(/\r?\n/);
  for(const [name,start,end] of [['display_fullimage',12,139],['jo9_seed_role_images',1,91],['assistant_stat',131,215],['plastics',40,52]])if(loc.name===name)audit.extractedBlocks.push({location:name,startLine:start,endLine:end,code:body.slice(start-1,end).join('\n')});
  const actCount=Number(core.shift(doc.lines[loc.body+1],5));
  for(let a=0;a<actCount;a++)for(const [j,label] of ['image','caption','body'].entries())fieldScan(loc,'action'+a+'.'+label,core.shift(doc.lines[loc.body+2+a*3+j],5));
  if(audit.callsites.length>before)audit.locations.push({location:loc.name,hits:audit.callsites.length-before});
}
function semanticClass(site){
  if(site.classification==='comment')return 'inactive_comment';
  if(site.classification==='developer')return 'developer_image_preview';
  if(site.location==='assistant_stat')return site.line>=188?'assistant_role_click_cache_or_gate':'assistant_role_menu_gate';
  if(site.location==='menu_form')return 'home_render_presence_gate';
  if(site.location==='display_fullimage')return 'common_full_image_resolution';
  if(site.location==='display_pic')return site.line<70?'appearance_metadata_inference':'common_action_full_image_resolution';
  if(site.location==='jo9_seed_role_images')return site.line<38?'legacy_role_key_map':site.line>=80?'legacy_registry_cleanup':'existing_alias_resolver';
  if(site.location==='$addon_custom_data')return site.line>=382&&site.line<450?'registry_purge':site.line<382?'actor_cache_refresh':'definition_preview';
  if(['get_stock_seed','get_special_assistant_quest','get_demo_slave','get_special_slave'].includes(site.location))return 'actor_cache_initialization';
  if(site.location==='#dynamic')return site.line===5065?'appearance_metadata_filter':'appearance_change_cache_write';
  if(site.location==='plastics')return 'appearance_change_preview';
  if(site.location==='black_market_interface'||site.location==='stasis_cell')return 'direct_definition_preview';
  if(site.location==='interaction'&&site.line===11479)return 'direct_event_seed_image';
  return 'event_or_result_cached_image_resolution';
}
for(const site of audit.callsites)site.semanticClass=semanticClass(site);
audit.counts={callsites:audit.callsites.length,runtime:audit.callsites.filter(x=>x.classification==='runtime').length,developer:audit.callsites.filter(x=>x.classification==='developer').length,comments:audit.callsites.filter(x=>x.classification==='comment').length,locations:audit.locations.length,resolverCalls:audit.resolverCallers.length,dynamicLookupLines:audit.dynamicLookupSites.length};
audit.currentPriorities=[
 {scope:'display_fullimage',lines:'40-132',order:'The selected indpack outfit/assistant-role mood variant overrides its normal indpack image; normal indpack overrides the legacy/cache default after alias repair. Horny (arousal>3) precedes rebel (moral<3). Empty-string checks only; missing nonempty paths do not fall through.'},
 {scope:'jo9_seed_role_images resolve',lines:'38-79',order:'Start from caller cache. For wanted=fullimage and a known exact legacy alias, map to corresponding indpack (then title for legacy roles). Otherwise retain caller path. Known stale Original25 aliases can be repaired. Multiple early exit branches must be preserved.'},
 {scope:'assistant_stat',lines:'135,141,149,194,202,209;191,198,206,213',order:'Six role-availability gates inspect only legacy role arrays. Four click handlers store legacy array values into assistant.fullimage. New-only role entries cannot open those menu choices.'},
 {scope:'$addon_custom_data/black_market_interface/stasis_cell',lines:'519/104/35',order:'Nonempty indpack_title wins; otherwise legacy fullimage or existing alias resolver. No physical-file check.'},
 {scope:'plastics',lines:'7,41-50',order:'Legacy fullimage presence is outer gate. Nonempty indpack_naked then overrides old preview. New-only naked cannot pass an empty legacy outer gate.'}
];
audit.pendingSpecification={status:'대기 목록; WORK 일괄 반영 보류',approvedScope:['QSP 전체의 메뉴 조건','클릭 시 이미지 조회','공통 출력','이벤트·결과 화면의 이미지 조회'],unchanged:['파일명','JSON 등록값','SAV 파일과 저장 형식','정상적으로 표시되던 화면의 후보 우선순위'],fallbackRule:'현재 화면이 먼저 선택하던 후보를 먼저 검사한다. 변형이 없으면 같은 등록의 일반 그림, 반대 등록의 해당 일반 그림, 기본 전신 순으로 실재하는 후보를 찾는다. 양쪽 후보가 정상인 화면은 지금과 같은 후보가 이긴다.',menuRule:'전용 역할의 새/옛 등록 중 실재 그림이 하나라도 있는지와 화면 출력용 기본 전신 대체를 구분한다. 기본 전신으로 대체 가능하다는 이유만으로 모든 전용 의상 메뉴를 새로 열지 않는다.',implementationDirection:'새 저장 캐시나 로케이션을 늘리기보다 기존 jo9_seed_role_images의 읽기 전용 조회를 확장하고, 직접 조회 화면만 같은 계약으로 연결하는 후보를 준비한다. 기존 resolve 호출 및 알려진 별칭/사용자 변경 캐시 보존 계약을 먼저 유지한다.',earlyExitWarning:'기존 resolver의 58·73·78행 등 직접 반환/exit 경로가 여러 개이므로 함수명을 기계적으로 바꾸거나 한 곳에 뒤쪽 fallback만 추가하면 일부 분기가 우회한다. 후보 반환 흐름 전체를 검토해야 한다.',missingBothLimit:'양쪽 기본 전신 실물까지 모두 없으면 조회 규칙만으로 그림을 만들 수 없다. 체크리스트에서 결손으로 유지하고 전역 무관 그림으로 치환하지 않는다.'};
audit.nonRenderingCautions=['display_pic:22-41의 fullimage 참조 10곳은 저장된 외형에서 머리색·길이를 복원하는 메타데이터 추론이다. 출력 경로로 간주해 기계적으로 교체하지 않는다.','#dynamic:5065의 fullimage는 성형 머리색 선택 필터이고 5072는 외형 변경 캐시 대입이다. 임의 이미지 파일명 재명명과 분리한다.','$addon_custom_data:384-387은 등록 배열 purge이며 이미지 조회가 아니다.','fullpregnant 직접 출현은 jo9_seed_role_images:33·69 두 곳이다. 이번 감사로 별도 임신 전신 출력 기능이 존재한다고 주장하지 않는다.','slavebase_test의 8행은 개발용 이미지 확인 화면이다. 주석 29행은 현재 비실행 코드로 따로 분류한다.'];
const exe=path.join(game,'..','Jack-o-nine-tails.exe');
audit.engineSupport={currentExe:exe,currentExeSha:crypto.createHash('sha256').update(fs.readFileSync(exe)).digest('hex'),existingQspSyntax:"dynamic 'jo9_exists = %<<$jo9_candidate>>%'",existingCurrentQspEvidence:['interior_change:2118','interior_change:2161'],documentation:'G:/somi/JO9sa/docs/WINDOWS_IMAGE_SLOTS_20261018.md',limitation:'현재 QSP에서 이미 의존하는 FastQSP 파일 존재 확인 확장이다. 표준 QSP/WASM 지원으로 일반화하지 않는다. 이번 읽기 전용 감사에서 현재 EXE로 새 실행 검사를 하지는 않았다.'};
audit.sourceUnchanged=crypto.createHash('sha256').update(fs.readFileSync(qsp)).digest('hex')===doc.hash;
fs.writeFileSync(path.join(__dirname,'audit.json'),JSON.stringify(audit,null,2)+'\n');
process.stdout.write(JSON.stringify({qspSha:audit.qspSha,counts:audit.counts,locations:audit.locations,engineSupport:audit.engineSupport,sourceUnchanged:audit.sourceUnchanged},null,2)+'\n');
