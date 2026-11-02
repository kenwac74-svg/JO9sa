from pathlib import Path
import json, hashlib
base=Path(__file__).parent
inventory=json.loads((base/'inventory.json').read_text(encoding='utf-8'))
plain={'glad_amason_ava.png','glad_armored_ava.png','glad_naked_ava.png'}
plain.update(f'gladiator_champion_{s}_ava.png' for s in ['absolute','corvus','kamira','sepris','taurus','vatican'])
plain.update(f'gladiator_{s}_{i}_ava.png' for s in ['dimaha','hoplite','kimerian'] for i in range(1,6))
plain.update(f'gladiator_secutor_{i}_ava.png' for i in [1,2,4,5])
plain.remove('gladiator_kimerian_5_ava.png')
assert len(plain)==27
plain.update(['warg_ava.png','ride_morrigan.png'])
rows=[]
for source in inventory['rows']:
    name=Path(source['path']).name
    decision='preserve_nonblack_or_existing_scene'
    reason='Existing colored, textured, or scene background; nonportrait artwork is also unchanged.'
    if name in plain:
        decision='replace_black_background'
        reason='Visually black or neutral dark charcoal empty background. Preserve subject and frame.'
    elif name=='glad_mistress_ava_3.png':
        decision='explicit_character_replacement'
        reason='User explicitly selected a new character image; its background should use the original ochre template.'
    elif name=='gladiatrix2_ava.png':
        decision='ambiguous_dark_grey_green_background'
        reason='Visible grey-green blurred gradient; not a clearly flat black background. Root should decide before adoption.'
    elif name in ('ride_jeeves.png','ride_jeeves (2).png'):
        reason='Red background/atmosphere is visible outside the black hair; preserve as an existing other color.'
    elif name in ('medic_ava.png','vampire_ava.png','gladiatrix1_ava.png'):
        reason='Dark scene includes colored objects, lighting, or backdrop; not an empty black canvas.'
    elif name=='gladiator_kimerian_5_ava.png':
        reason='Direct PNG and enlarged details review show a green forest backdrop. Preserve the existing other-color background.'
    rows.append({**source,'decision':decision,'reason':reason})
current=hashlib.sha256((Path(inventory['root'])/'jack.qsp').read_bytes()).hexdigest()
result={'method':'Independent visual review of all three inventory contact sheets, direct representative PNG inspection, and enlarged details.png review. Corrected kimerian_5 to preserve its green forest background. No image edits.','qspSha256':current,'qspUnchanged':current==inventory['qspSha256'],'plainBlackRecommended':len(plain),'explicitReplacement':1,'ambiguous':1,'rows':rows}
(base/'independent-classification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
report='''# MOB 초상 배경 독립 시각 검토

98개 검토 입력을 세 장의 연락표로 확인했고, 와그·지브스·모리건·여검투사2 및 대표 이미지는 개별 PNG로 다시 확인했다. 이후 details.png의 4종 확대 비교와 킴메르 투사E 원본 PNG를 추가 확인하여, 초기 연락표에서 잘못 포함한 킴메르 투사E를 제외했다. WORK·세이브·QSP·이미지에는 수정하지 않았다.

- **검정/짙은 차콜 빈 배경 29개:** 아레나 기본 3개, champion 6개, dimaha/hoplite 각 5개, kimerian 1~4의 4개, secutor 1/2/4/5, 와그, 모리건. 인물과 프레임은 유지하고 배경만 교체하는 대상으로 권장한다.
- **명시적 캐릭터 교체 1개:** glad_mistress_ava_3.png. 현재 배경은 황토색이지만 사용자가 새 캐릭터를 지정했으므로 새 소스의 검은 배경을 황토색으로 바꾸어야 한다.
- **애매한 어두운 배경 1개:** gladiatrix2_ava.png는 회녹색 흐린 배경으로 보인다. 검정 단색으로 확정하지 않아 루트 판단 대상으로 분리했다.
- **유지:** gladiator_kimerian_5_ava.png는 초록 숲 배경이 명확하다. ride_jeeves는 검은 머리 외부의 붉은 배경이 있고, medic·vampire·gladiatrix1은 어둡더라도 색과 장면 요소가 있다. 그 외 색상·텍스처·장면 배경과 비초상 전리품/템플릿은 유지한다.

정확한 파일별 분류와 입력 해시는 independent-classification.json에 기록했다. 검은 머리카락·의상·프레임을 색 임계값만으로 배경에 포함하면 손상될 수 있으므로, 전경 보존 검증과 결과 연락표 검토가 필요하다.
'''
(base/'INDEPENDENT_CLASSIFICATION_KO.md').write_text(report,encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k!='rows'},ensure_ascii=False))
