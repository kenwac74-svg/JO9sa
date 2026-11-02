# MOB 이미지 세트 편집기

catalog-mob-sets.js는 카탈로그 HTML에 삽입되는 독립 실행 UI이다. 프레임 데이터와 얼굴 선택 helper도 생성 블록으로 포함한다.

포트레이트는 얼굴 영역 선택 → frameClass에 맞는 프레임 → 150×150 미리보기 → 기존 PIC apply API로 저장한다. 전신/패배는 기존 795×596 자동 조절을 유지한다.

portrait-crop.js 또는 frame-data.json 수정 시:

```
node tools/mob-image-sets/build-portrait-assets.cjs --write
node tools/mob-image-sets/build-portrait-assets.cjs --check
node --test tools/mob-image-sets/geometry.test.cjs tools/text-workshop/pic-local.test.cjs
```

실제 반영은 해당 생성 결과를 WORK와 seed 카탈로그의 MOB_SET_CATALOG 블록에 동기화한다. 카탈로그 D행과 JO9_MOB_SETS manifest를 임의로 바꾸지 않는다. source helper만 바꾸면 이미 열린/삽입된 UI는 바뀌지 않는다.

세부 사용법·입출력·검증·복구: records/mob-portrait-crop-20261030/REPORT_KO.md. 브라우저 재현은 같은 기록 폴더의 browser-test.cjs, 운영 미저장 확인은 live-test.cjs이다.
