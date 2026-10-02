# 최신 소스 보관

| 파일 | 날짜 | 크기 | SHA-256 |
|---|---|---|---|
| `jack_2026-10-01.qsp` | 2026-10-01 | 17,019,470 B | `59e1a1afb4fdd2e9bf9b1ffdcb12c10f2f4cc15d4cd3d890e21f8cb652f5958e` |
| `jack_2026-10-02.qsp` | 2026-10-02 | 17,026,702 B | `8d963ae88dcea0db9500b29bcd5112933abd81042d5be8516113840094e607c6` |
| `jack_2026-10-02_whore_redlight_sequences.qsp` | 2026-10-02 | 17,027,194 B | `a70e618017de9ba5e474cf3945f2d93a023dab4a24129ef742313c8367c295f3` |
| `jack_2026-10-03_whore_redlight_u_sequence.qsp` | 2026-10-03 | 17,027,394 B | `fb630aca0bf688e7819e74fb571587833c33f39b6ef266f425b2cf5a93dac084` |

- 기준은 항상 게임 폴더의 `game\jack.qsp`다. 보관 파일은 게임 폴더 상태를 날짜별로 동기화한 스냅샷이다.
- 현재 최신 스냅샷은 `jack_2026-10-03_whore_redlight_u_sequence.qsp`이며 `tools/qsp_dump.py`로 248개 location이 정상 파싱된다.
- 분석할 때는 최신 스냅샷을 사용한다: `python tools/qsp_dump.py source/jack_2026-10-03_whore_redlight_u_sequence.qsp <출력.json>`
- 게임 QSP가 바뀌면 새 날짜 파일로 추가하고 이 표를 갱신한다. 기존 스냅샷은 덮어쓰거나 삭제하지 않는다.
- 보관 스냅샷을 게임 폴더에 덮어쓰지 않는다. 동기화 방향은 게임 폴더에서 보관본으로만 한다.
