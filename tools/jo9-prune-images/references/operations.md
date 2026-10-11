# 외부 보관 도구

`scripts/archive_images.py`는 Python 표준 라이브러리만 쓴다. 모든 경로는 절대 경로를 권장한다. 결과 파일은 JO9 밖에 둔다. 원본·백업·동기화 자료는 `--protect`로 추가하며 이동 대상 루트 자체가 보호 경로에 속하면 중단한다. 링크·junction을 통해 외부로 빠지는 파일은 취급하지 않는다.

## 조사 시점 고정

조사 **전에** 스냅샷을 만든다. 스냅샷 생성은 참조 조사 자체가 아니다.

```text
python archive_images.py snapshot --root "G:/somi/JO9" --output "G:/somi/JO9_audits/run/snapshot.json"
```

기본으로 이미지 목록·크기·수정 시각과 코드/데이터/엔진/저장 파일 해시를 기록한다. 이미지 전체 바이트는 해시하지 않는다. 기본 확장자 밖의 실제 의존 파일이 있으면 `--dependency "상대/경로"`를 반복해서 추가한다. `.git`, `node_modules`, `__pycache__`, `__JO9_ImageBackups`는 보존 대상이며 조사 스냅샷에서 제외한다. Windows `desktop.ini`는 제외한다. 그 밖의 읽기 오류는 중단한다. 스냅샷 제외 영역에 현재 실행 의존성이 있다면 기본 규칙을 수정하거나 명시적 의존 파일로 포함한다.

현재 QSP의 장면전환 등록 경로와 원본 B컷 manifest의 A/별칭 경로는 도구에서도 이동을 거부한다. manifest가 지정한 원본 루트는 자동 보호한다. 알려진 `content/jo9o_original_cuts` 연결은 실제 대상 일치를 확인한 뒤 원본 파일의 목록·크기·수정 시각을 따로 기록하고 재귀 탐색하지 않는다. 다른 링크·junction은 계속 거부한다. 이 검사도 전환 외의 모든 동적 참조를 대신하지는 않는다.

## 검토 파일과 계획

조사 목록 `audit.json`은 `root`(조사 루트), `snapshot_sha256`(조사 시작 시 만든 스냅샷 파일의 SHA256), `rows`(파일별 배열)를 가진 객체다. rows에는 최소 `path`, `status`가 있다. 이동 후보의 status는 `unreferenced_candidate`여야 한다. `path`는 조사 루트 기준 상대 경로다. 과거 조사 결과를 새 스냅샷에 연결해서 최신 조사처럼 만들지 않는다. 기존 감사 파일의 status만으로 자동 승격하지 않는다.

검토 파일 `reviews.json`:

```json
{
  "audit_root": "G:/somi/JO9",
  "reviews": [
    {
      "path": "game/content/pic/work/example_mask.png",
      "decision": "move",
      "proofs": {
        "static": "실제 QSP/CSS/JSON 조사에서 해당 경로 참조 없음. 조사 보고서의 위치를 적을 것.",
        "dynamic": "해당 파일로 조합될 수 있는 변수와 선택 함수의 조사 근거를 적을 것.",
        "index": "엔진 탐색과 picMax 풀에 영향을 주지 않는 근거를 적을 것.",
        "external": "지원 저장본/추가 패치의 경로 공급자를 확인한 근거를 적을 것.",
        "intent": "생성 작업의 마스크로 게임에는 불필요하며 외부에서 원본 보존."
      }
    }
  ]
}
```

위 예시는 형식 설명이며 실제 검토 근거가 아니다. 확정하지 못한 파일은 `decision: "hold"`와 `reason`을 기록한다. `move`에는 다섯 근거가 모두 필요하다. 도구는 근거의 존재를 확인할 뿐 정확성을 증명하지 못하므로 근거를 실제 조사로 작성한다.

```text
python archive_images.py plan --snapshot ".../snapshot.json" --audit ".../audit.json" --reviews ".../reviews.json" --archive "G:/somi/JO9_unused_images/run" --output ".../plan.json" --protect "G:/somi/JO9O"
```

plan은 파일을 이동하지 않는다. 조사 시점과 현재 상태를 대조하고 선택된 이미지의 SHA256을 읽어 계획에 넣는다. 보호 대상에는 원본 및 동기화된 자료 루트를 지정한다. archive와 원본은 서로 포함될 수 없고 보호 대상과도 겹치지 않아야 한다. `plan.json`에 수·용량·원래 경로·보관 경로·파일 해시·검토 근거가 담긴다.

## 실제 이동과 복구

사용자의 이동 요청/승인 범위가 이 계획을 포함할 때만 실행한다. 소스가 바뀌었다면 조사부터 새로 한다. 이미지 교체 도구 등 다른 쓰기 작업을 중단하고 실행한다. 여러 이동/복구 작업을 병렬로 실행하지 않는다.

```text
python archive_images.py apply --plan ".../plan.json"
python archive_images.py restore --journal "G:/somi/JO9_unused_images/run/journal.json"
```

apply는 시작 전에 스냅샷·원본 해시·대상 충돌을 검증한다. 파일별 복사→해시 확인→원본 제거 순서이며 journal은 작업 전에 생성하고 각 단계에 갱신한다. 오류 시 이후 파일을 처리하지 않는다. 전체 작업이 하나의 원자적 거래는 아니므로 부분 작업은 journal로 복구한다. 실패한 apply를 반복 실행하지 말고 기록을 확인한다.

restore는 이미 사라진 원본을 복구하고, 원본과 외부 복사본이 모두 동일하면 외부 복사본만 정리한다. 원본에 다른 내용이 있거나 외부 사본이 손상되었으면 중단한다. 복구 완료 뒤에도 plan과 journal은 보존한다. 최종 보고에 두 경로를 링크한다.

복사 도중 중단되어 불완전한 사본이 남으면 자동 복구는 덮어쓰지 않고 멈춘다. 해시로 정상 원본의 존재와 복사 실패를 확인한 뒤 불완전한 사본을 별도 보존하고 복구를 다시 실행한다. journal 갱신 도중 중단되면 `journal.json.tmp`가 남을 수 있다. 원래 journal과 파일 상태를 대조해 별도로 보존한 뒤 복구한다. 작업 기록을 임의로 지워 재시도하지 않는다.

## 배포 검증

빌드 스크립트의 입력 루트와 include/exclude를 확인한다. 외부 보관/감사 폴더가 상위 폴더 glob으로 다시 묶이지 않도록 한다. ZIP 생성 후 실제 목록에서 제외 여부를 확인하고 전후 압축 크기를 비교한다. 별도 catalog에서 외부 경로를 지원하는지 확인 후 해당 기능으로만 갱신한다. 원본 경로/ID/태그/패치 이력을 삭제해 목록에서 감추지 않는다.
