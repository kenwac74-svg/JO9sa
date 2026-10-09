# PC 이전과 작업 동기화 — 사용자 확정 (2026-10-09)

큰 이미지와 실제 게임 자료는 사용자가 이동한다. 도구·체크리스트의 목록, 고정번호, 체크 상태, 진행 기록, 이력, 개인 제작 원장, 키를 제외한 모델 설정은 AI가 한 작업 묶음으로 관리한다.

## 일상 작업 / PC 옮긴다
기존 목록 동기화와 현재 상태 JS 내보내기는 그대로 사용한다. JS만으로 전체 작업을 이전했다고 판단하지 않는다.
사용자가 “PC 옮긴다”라고 하면 AI는 `tools/local-workspace/Save-JO9-Work.ps1 -Push`를 실행하여 최신 관리 자료를 catalog-seed에 저장하고 최신 도구·패치 기록과 함께 커밋·푸시한다. 원격 SHA까지 확인한 뒤에만 완료 보고한다. 최초 대상 경로는 local.config.json의 game/original/catalog/runtime으로 지정한다. 이 파일은 git에 넣지 않는다.

새 PC: main을 pull하고 게임·순정 경로를 지정해 Open-JO9-Tools.cmd를 실행한다. 처음 실행하면 중첩 image_work 기록까지 복원하고 경로를 바꾼다. Node와 Codex에 포함된 Python을 사용한다. 기존 도구 Python이 없다면 Python도 한 번 필요하다. 이미 작업 목록이 있는 PC에는 AI가 sync-workspace-state.py --source catalog-seed --catalog 실제관리폴더 --game 플레이game --original 순정game로 병합한다. 번호 충돌은 자동 재번호하지 않고 작업을 중단한다.

## 저장 범위
catalog_merge_vs_original.html / catalog_work_ids.json / catalog_status.js / image_work/progress.json / history.jsonl / bg_queue.json / personal-patch/events.jsonl / settings.json과 도구 소스.
API 비밀키, 토큰, 로그, runtime/backups, 이미지 객체 blobs, 게임 QSP·대용량 이미지·생성 ZIP은 저장 묶음에 넣지 않는다. git의 이미지 작업 원장에는 경로와 해시·시각만 남긴다. 개인 이미지팩 제작 때 객체 사본이 없으면 현재 플레이 파일을 읽고 해시 일치 때만 사용한다. 이전 파일과 다르면 오류를 내며 과거 이미지를 지어내거나 덮어쓰지 않는다.

원본 B컷 242개는 순정 참조 연결이다. 사용자가 옮긴 게임과 순정에 맞춘 junction 및 image-original-cuts.json은 검증된 이전 적용기의 담당이며 메타데이터 병합기는 순정·게임 이미지를 만지지 않는다.

## 이번 누락 해결
추가 목록 245개, 고정번호 357개, 진행 기록 90건 및 기존 기록, 이력 56건, 제작 원장 298건을 이전 패키지에서 복구했다. 홈컴 전용 경로로 변환했으며 작업번호·이미지·QSP를 임의 변경하지 않았다. 112개 번호는 현재 목록 외의 보존 번호이며 재사용하지 않는다.
