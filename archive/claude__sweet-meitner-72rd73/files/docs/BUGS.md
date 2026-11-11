# JO9UIpatch — 확인된 버그 기록

## BUG-001 — 아마란스 살롱 서비스 화면에 이전 서비스 이미지가 잔류함

기록일: 2026-09-27  
상태: **수정 필요**  
우선순위: 중간  
영향 범위: `interaction_city`의 아마란스 살롱 서비스 분기 / 공용 service 렌더링

### 증상

아마란스 살롱에서 서비스를 이용했을 때, 의도된 살롱 이미지(`scene\VIP\VIP3` 등)와 함께 이전에 사용한 서비스 이미지가 추가로 표시될 수 있다.

실제 확인 사례:
- `scene\service\service_small_tattoo_2.png`
- `scene\service\service_tattoo_fiend.png`
- 같은 방식으로 다른 `scene\service\...` 이미지도 이전 상태에 따라 잔류 가능

따라서 아마란스 살롱 코드가 특정 문신 이미지를 직접 선택하는 것처럼 보일 수 있으나, 실제 원인은 이전 서비스 이미지 변수의 잔류다.

### 원인

공용 서비스 처리에서 `$service_picture`를 이미지 경로로 사용한다.

일반 서비스 분기는 보통 다음처럼 `$service_picture`를 새로 지정한다.

```qsp
$service_picture = 'scene\service\service_tattoo_fiend'
g = rand(1, picMax['service_tattoo_fiend'])
if g > 1: $service_picture += '_' + $str(g)
```

그러나 아마란스 살롱의 서비스 분기(확인 대상: `interaction_city = 102024`, `102025`, 남/녀 주인공 대응 분기)는 `$interaction_type = 'service'`를 사용하면서도 `$service_picture`를 새로 지정하거나 초기화하지 않는다.

`interaction_city` 진입부에서는 `$bg_path`, `$special_image`, `$special_image_full` 등은 초기화하지만 **`$service_picture`는 초기화하지 않는다.**

그 결과 직전에 실행된 서비스에서 남은 `$service_picture` 값이 공용 service 렌더링에서 다시 사용되어 아마란스 살롱 화면에 끼어든다.

### 왜 이미지 교체툴에서 두 장이 동시에 검출되는가

아마란스 살롱은 자체적으로 `$special_image`에 `scene\VIP\VIP3.png` 같은 장면 이미지를 넣는다.

동시에 공용 service 처리에서는 잔류한 `$service_picture`가 `$bg_path`로 사용될 수 있다.

따라서 최종 렌더링에는 다음이 함께 존재할 수 있다.

```text
bg/erosalon.png
+ scene/VIP/VIP3.png
+ 이전 service_picture (예: service_small_tattoo_2.png)
```

이미지 교체툴이 여러 이미지를 잡는 것은 정상적인 추적 결과이며, 고아 파일 판정 문제가 아니다.

### 수정 방향

가장 작은 수정안:

아마란스의 해당 서비스 분기에 진입할 때 `$service_picture`를 명시적으로 비운다.

```qsp
$service_picture = ''
```

적용 후보:
- `interaction_city = 102024`
- `interaction_city = 102025`
- 동일 내용의 남/녀 주인공 대응 분기 전부

대안으로 공용 interaction 초기화부에서 매번 `killvar '$service_picture'`를 할 수도 있으나, 다른 서비스 흐름에 미치는 범위가 더 크므로 먼저 아마란스 분기에서 최소 수정하는 방식을 우선 검토한다.

### QA

수정 후 다음 순서로 확인한다.

1. 보 아저씨 문신 서비스에서 `service_tattoo_fiend*` 또는 `service_small_tattoo*`를 표시한다.
2. 바로 아마란스 살롱으로 이동한다.
3. 20/50 스파크 서비스 각각 실행한다.
4. 아마란스 화면에서 이전 `scene\service\...` 이미지가 더 이상 포함되지 않는지 확인한다.
5. `VIP3.png` 등 아마란스가 의도한 장면 이미지는 그대로 표시되는지 확인한다.
6. 다른 일반 서비스들의 `$service_picture` 표시가 깨지지 않는지 회귀 테스트한다.

## BUG-002 애완묘 훈련 후 가끔 빈 화면 (2026-10-03, 0.14, 재현 불가·간헐)
- 증상: 노예 교육 → 특수 기술 → 애완묘 훈련(interaction 1241) 뒤 메인 배경(`SNKmod/ui/bg_main.png`)만 나오고 메뉴·카드·텍스트가 하나도 출력되지 않는다. Show HTML의 body에 엔진 기본 빈 틀 두 개만 있다.
- 사용자 재시도에서는 재현되지 않음. 무작위 분기에서만 생기는 것으로 보인다.
- 확인한 것: interaction 1241 본문은 순정과 같다(개인실 진입 보호 줄만 추가). `$catplay_lesson_description`은 정의돼 있다.
- 의심(미확인): 교육 거부 등 무작위 결과에서 이어지는 분기(전투 시작 등)가 개인실 진입 보호 줄과 맞물리거나, 화면 출력 전에 다른 location으로 넘어가는 경우.
- 필요한 것: 개인실에서 했는지 메인에서 했는지, 그리고 클릭 직전 세이브. 다시 생기면 그 세이브로 재현한다.
