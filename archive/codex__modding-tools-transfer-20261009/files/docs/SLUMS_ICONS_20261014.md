# 주거 구역 및 차고 아이콘 — 2026-10-14

게임 설정에 맞춰 built-in image_gen으로 각각 새로 생성했다. 주거 구역은 낡은 빈민가 주택, 차고는 바이커의 오토바이 정비소다. 원래 금색 프레임에 기계적으로 축소·합성하여 59×66px RGBA를 유지한다.

`mods/2026-10-14_slums_colour_icons.json`은 `city_menu_form`의 6031 및 9210/9214/9218 연결만 바꾼다. 새 변수는 주거 구역 메뉴 진입마다 초기화하므로 기존 세이브에서도 사용할 수 있다. 공용 unfamiliar.png와 진입 조건은 유지한다.

설치: `tools/install-slums-icons.ps1 -Game <게임폴더>`로 새 이미지 두 개와 해당 QSP mod만 적용한다. 전체 mods 폴더를 재적용할 필요는 없다. 백업·해시·작업 시각·개인 패치 포함 대상은 `records/ui/2026-10-14-slums-icons.json`에 기록했다. 다른 PC 패치에 이 기록의 두 이미지 경로를 포함한다. 고해상도 원화는 로컬 게임 `modworkpic/2026-10-14-slums-icons`에 보관하며 Git 이미지 패치에는 59×66 최종 아이콘만 넣는다.

검증: QSP 바이트 왕복, 다른 location 및 액션 불변, 정확한 네 메뉴 연결, PNG 규격/파일 해시, 적용 후 재적용 검사. 실제 게임 재시작 후 빈민가 메뉴에서 주거 구역·차고 표시와 진입 확인은 사용자에게 요청한다.

## 최종 생성 프롬프트

### 주거 구역

Generate a brand new standalone raster game menu icon artwork, dark gothic fantasy painterly concept art. Subject: a compact cluster of two poor weathered half-timbered houses in an impoverished ancient fantasy city, uneven patchwork roofs, visibly lived-in crooked wooden doorway, one warm amber lantern and small amber-lit window. This is a residential slum quarter, not a castle, not a cemetery, not ruins without inhabitants. No people. Clear readable building silhouette, simple bold shapes designed to remain recognizable at a tiny 50px menu thumbnail. Full color: deep desaturated teal atmosphere, warm copper wood and amber window lights, restrained moss green, good light-dark contrast, definitely NOT grayscale. Centered close composition, houses fill most of the image, modest dark atmospheric backdrop. Portrait 4:5 composition. No text, no letters, no labels, no border, no UI frame, no logo, no watermark. Deliver only the finished icon painting.

### 차고

Generate a brand new standalone raster game menu icon artwork, dark gothic fantasy painterly concept art, coordinated with an impoverished medieval fantasy city icon set. Subject: a biker's ramshackle motorcycle repair garage in that fantasy city. A single heavy black-and-brass motorcycle with very prominent large front wheel and warm round amber headlamp, parked just inside an open weathered timber and stone workshop doorway; one clear wrench and a small cogwheel on the workshop wall communicate repair. Motorcycle is canonically present in this world. No car, no futuristic city, no modern showroom, no people. Strong unmistakable motorcycle-and-workshop silhouette, bold simple shapes designed to remain recognizable at a tiny 50px menu thumbnail. Full color: deep desaturated teal shadows, copper rust and brass, warm amber lamplight; high contrast, definitely NOT grayscale. Centered close composition, motorcycle fills most of the image. Portrait 4:5 composition. No text, no letters, no labels, no border, no UI frame, no logo, no watermark. Deliver only the finished icon painting.
