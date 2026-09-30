JO9 Text Workshop v0.1 (개발본, 실게임 미검증)

무엇을 하나
-----------
게임 화면에 보이는 대사와 지문의 실제 사용처를 jack.qsp에서 찾아 목록으로 보여주고,
사용자가 고른 항목만 수정합니다. 적용 전 jack.qsp를 자동 백업하고, 저장 결과를 검증하며,
실패하면 자동 복구합니다. 작업 단위로 되돌릴 수 있습니다.
Python은 필요 없습니다. Windows 기본 PowerShell과 브라우저만 사용합니다.

수정할 수 없는 것 (v0.1)
------------------------
변수가 들어간 문장(<<변수>>), 문자열 조립, 변수 값, 조건·코드, 텍스트 Key 분리, Preset.
변수 포함 문장은 목록에 "변수 포함 텍스트"로 표시되지만 수정 버튼이 없습니다.

설치 (Image Workshop v1.1.2 PIC_TOP_R1이 먼저 설치되어 있어야 합니다)
------------------------------------------------------------------
1. 게임과 Image Workshop 창을 닫습니다.
2. 이 폴더(TEXT_WORKSHOP_INSTALL.cmd, payload 폴더)를 Jack-o-nine-tails.exe가 있는 게임 최상위 폴더에 풉니다.
3. TEXT_WORKSHOP_INSTALL.cmd를 실행하고 YES를 입력합니다.
   - Image Workshop의 JO9_Detect.ps1, JO9_Server.ps1, JO9_Place_Workshop.html 3개에 연동 코드를 붙입니다.
     원본 3개는 game\modtools\text\hook_backup에 보관됩니다.
   - 세 파일이 기준본과 해시가 다르면 아무것도 바꾸지 않고 중단합니다.
   - jack.qsp와 게임 엔진(jack.exe)은 설치 중에 건드리지 않습니다.
4. Image Workshop 패치 관리자로 "설치/업데이트"를 다시 실행하면 연동이 덮어써집니다. 그때는 3번을 다시 하세요.

사용
----
1. 게임에서 수정하고 싶은 화면을 띄우고 Other → Image Workshop을 실행합니다(화면 정보가 저장됩니다).
2. 열린 Image Workshop 페이지 위쪽의 [텍스트 편집 열기]를 누릅니다.
3. [현재 화면] 탭에서 화면과 일치하는 문장을 확인하고 [수정]을 누릅니다.
   같은 문장이 다른 곳에도 있으면 목록으로 나오며, 체크한 곳만 바뀝니다(기본은 선택한 항목 하나).
4. [적용 전 확인]에서 변경 내용을 확인하고 [적용]을 누릅니다.
5. 수정 결과는 게임을 다시 불러오거나 재시작해야 보일 수 있습니다.
6. 이름 등을 골라서 바꾸려면 [텍스트 검색] 탭을 사용합니다. 되돌리기는 [기록] 탭에서 합니다.

안전 장치
---------
- 적용 직전 jack.qsp의 SHA-256이 탐색 시점과 같은지 확인합니다. 다르면 적용을 중단합니다.
- 백업은 game\modtools\text\backups\<작업ID>\jack.qsp 에 저장됩니다.
- 저장 후 파일을 다시 읽어 해시를 검증하고, 실패하면 백업으로 자동 복구합니다.
- 되돌리기는 그 작업 이후 jack.qsp에 다른 변경이 없을 때만 허용됩니다. 여러 작업은 최신부터 되돌리세요.
- 다른 모드(UI 패치 등)가 jack.qsp를 바꾸면 그 이후에는 이전 작업을 되돌릴 수 없습니다.

제거
----
TEXT_WORKSHOP_REMOVE.cmd 를 실행하면 Image Workshop 3개 파일이 원본으로 복구되고 Text Workshop 프로그램이 삭제됩니다.
수정한 텍스트를 원래대로 돌리려면 제거 전에 [기록]에서 되돌리세요. 백업과 기록은 남습니다.

개발자용 시험
-------------
node textworkshop/tests/test_core.js --qsp <jack.qsp>
node textworkshop/tests/test_server.js --qsp <jack.qsp> --pwsh <pwsh>
node textworkshop/tests/test_ui.js --qsp <jack.qsp> --pwsh <pwsh> [--shots <폴더>]
node textworkshop/tests/test_install.js --iw <Image Workshop 압축 해제 폴더> --pwsh <pwsh>
(ui 시험은 playwright 필요. NODE_PATH로 지정)
