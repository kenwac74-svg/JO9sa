<!-- 2.4.1 이전 옛 브랜치 작업 히스토리 백업의 색인 -->
# 2.4.1 이전 브랜치 백업 (2026-11-07)

옛 브랜치를 병합 부모로 연결해 커밋 히스토리를 모두 보존한다. 각 폴더의 `files/`에는 브랜치에서 바뀐 텍스트 파일만 있다. 이미지·zip 같은 바이너리와 1MB 넘는 파일은 빼 두었고, 그 목록과 커밋 기록은 각 폴더의 `README.txt`에 있다. 빠진 파일 내용이 필요하면 해당 커밋에서 `git show <커밋>:<경로>`로 꺼낸다.

| 폴더 | 원격 브랜치 끝 커밋 |
|---|---|
| `JO9imgtool` | `d0ca7dc` |
| `brothel` | `4660868` |
| `claude__elegant-carson-nbb823` | `4bed325` |
| `claude__lucid-ramanujan-2821xz` | `6db703a` |
| `claude__sweet-meitner-72rd73` | `cd6b7a8` |
| `codex__jo9-team-roles-20261011` | `028db86` |
| `codex__modding-tools-transfer-20261009` | `151a728` |
| `design__slave-voice` | `dbdca06` |
| `newimgadd` | `7612c71` |

폴더를 따로 만들지 않은 브랜치는 다음과 같다(히스토리는 보존됨).
- `JO9UIpatch`, `codex/snkmod-0.1-handoff`: 모두 `claude/sweet-meitner-72rd73`에 포함된다.
- `vscode-mods-20261001`, `vscode-mods-20261002`: 이미 main에 들어가 있다.
