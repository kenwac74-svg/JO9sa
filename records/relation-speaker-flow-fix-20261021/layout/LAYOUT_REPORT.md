# 관계 대화 화자 줄 배치 검사

검사일: 2026-10-21. 게임/저장/저장소 파일은 수정하지 않았다.

## 결과

실제 FastQSP에서 내보낸 일반/긴 조건의 1–6쪽을 원본과 후보로 각각 렌더링해 12쌍, 총 24건을 측정했다. 측정한 범위에서 가로 넘침, 화면 하단 초과, 하단 장식과의 겹침이 없었다. 페이지 오류는 0건이고 게임의 `경기천년제목 Medium.ttf`를 실제로 불러왔다.

| 페이지 | 일반 후보의 마지막 글자 하단 | 긴 조건 후보의 마지막 글자 하단 | y792 하단 장식까지 최소 여유 |
| --- | ---: | ---: | ---: |
| 1 질문 | 687.81px | 687.81px | 104.19px |
| 2 출신/문화 답변 | 711.22px | 711.22px | 80.78px |
| 3 외모/성격 질문 | 664.41px | 664.41px | 127.59px |
| 4 특징 답변 | 664.41px | 687.81px | 104.19px |
| 5 종합 질문과 답변 | 734.63px | 734.63px | 57.38px |
| 6 덧붙이는 답변 | 711.22px | 711.22px | 80.78px |

`normal.p1.candidate.png`, `normal.p2.candidate.png`, `long.p4.candidate.png`, `long.p5.candidate.png`를 직접 확인했다. 부정적인 문화 평가 뒤 공감으로 넘어가는 답변, 화자 표시, 색상, 서술문 뒤 빈 문단과 화자 줄이 보존되어 있다. 긴 특징 답변은 실제로 선택된 4개 특징 문장을 포함한다.

## 기존 CSS 제약

- 게임 설정: 1280×800.
- 일반 대화 `#text`: x30, top615 + margin-top6 = y621, 폭740, 높이185. 글꼴18px, 줄 높이130% = 23.4px. `overflow:visible`이다.
- `body::after`의 하단 장식은 y792–800을 덮는다. 따라서 대화 칸의 명목상 bottom806보다 y792가 이 검사에서 쓰는 보수적인 하단 경계다.
- 화자 줄 하나는 실제 측정에서 약23.40625px를 더 사용했다. 긴 답변/많은 문단 조합에서는 남은 여유를 소비할 수 있다.

## 범위와 한계

이 결과는 현재 게임 CSS와 실제 게임 글꼴에 실제 native QSP 출력 문장을 넣은 headless Edge 측정이다. QtFastQSP 자체의 화면 캡처나 글꼴 배치를 증명하지 않는다. 사용자 브라우저 탭은 열거나 변경하지 않았다.

일반/긴 조건은 대표 표본이다. 모든 관계·성격·어조·질투·장문 특수 분기의 최악 조합을 전수 검사하지 않았다. 특히 이번 5쪽 출력은 짧은 종합 답변이며 질투 문장이 없다. 따라서 모든 가능한 5쪽이 화면에 들어온다는 주장을 하지 않는다. 원본과 후보는 독립 native 실행이므로 일부 무작위 말투/어휘가 서로 다르다.

현재 `interaction_screen`이 적용하는 선행 공백/`br` 제거를 동일하게 적용했다. 서술문 중간의 실제 문단과 화자 앞 간격은 유지했다. 별도 CSS 보정은 하지 않았다.

## 근거와 재현

- 원본 SHA256: `498e7fcaa2c116e382ab73ffe38549762297cce945247c2b8ad27509ba874fe0`
- 후보 SHA256: `c6ba9600e78f38ae1adeb9cf5c09a53115254ec40f666e48b53b912ab3e0195e`
- base.css SHA256: `593f1f8e4aa80413b2da01af9bb8ffe35a869738f0652f5df821e4bbb4b0ffc3`
- 브라우저: Edge 155.0.4283.62, headless, deviceScaleFactor1.
- `native-pages.json`: component/edges의 원본/후보 normal/long native stderr를 euc-kr로 해독한 12쌍의 문장. native 런너가 export 메시지를 성공 marker와 동일한 단독 메시지로 취급하지 않아 export 행의 boolean은 false지만, 시작 marker와 모든 6쪽 및 `JO9_EXPORT_END`의 존재를 별도로 확인하고 추출했다. export boolean은 이 측정의 성공 판단에 사용하지 않았다.
- `layout-results.json`: 24건의 실제 계산 스타일, 텍스트 사각형, 높이/너비, 경계 판정.
- `*.baseline.png`, `*.candidate.png`: 전체 24건의 대화 영역 캡처. 장식 외 배경은 브라우저 기본 흰색이다.
- `extract-native-pages.cjs`, `measure-native-layout.cjs`: 재현 스크립트. 원본 측정 도구 `tools/measure-dialogue-layout.cjs`는 변경하지 않았다.

재실행:

```powershell
node G:/Codex/tmp/relation-speaker-flow-fix-20261021/layout/extract-native-pages.cjs
node G:/Codex/tmp/relation-speaker-flow-fix-20261021/layout/measure-native-layout.cjs G:/Codex/tmp/relation-speaker-flow-fix-20261021/layout/native-pages.json
```

브라우저 profile/temp 및 launch-smoke 진단 자료는 검증 후 정리했다. 실제 native 출력, 최종 측정 결과, 캡처와 재현 스크립트만 남겼다.
