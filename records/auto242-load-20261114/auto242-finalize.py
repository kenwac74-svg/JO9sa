import pathlib,json,re,shutil,html
R=pathlib.Path('G:/somi/JO9sa');D=R/'records/auto242-load-20261114'
OUT=pathlib.Path('G:/somi/JO9_2.4.2_Full_20261113');A=OUT/'announcement-assets'
T=pathlib.Path('G:/Codex/tmp/auto242-load-20261114')
section='''<h2>2.4.1 세이브로 이어하기</h2>
<p><strong>2.4.1에서 전투를 끝내고 일반 화면에서 저장한 파일</strong>을 지원합니다. 별도 호환기나 사전 변환 없이 게임에서 바로 불러올 수 있습니다.</p>
<ol><li>원래 게임 폴더와 세이브는 그대로 보관해 주세요.</li><li>사용할 세이브 파일을 새 2.4.2 폴더의 <strong>game/save</strong>에 복사합니다.</li><li><strong>Jack-o-nine-tails.exe</strong>를 실행하고 <strong>Game → Load</strong>에서 불러옵니다. 필요한 이름·이미지·음원 경로 보정은 불러올 때 자동으로 적용됩니다.</li><li>불러온 뒤에는 새 이름으로 한 번 저장해 계속 플레이해 주세요.</li></ol>
<p>직접 지은 이름과 사용자 지정 이미지, 육성·장비·관계·진행 기록을 유지합니다. 전투 중 저장과 다른 버전의 세이브는 이번 지원 범위에 포함되지 않습니다.</p>
<p><strong>【이미지 자리 ② — 02_auto_save_loading.png 첨부 / 게임에서 바로 불러오는 순서 안내】</strong></p>
'''
(D/'announcement-save-section.html').write_text(section,'utf-8')
p=A/'announcement-body.html';s=p.read_text('utf-8');s,n=re.subn(r'<h2>2\.4\.1 세이브로 이어하기</h2>.*?(?=<hr><h2>버그 제보와 감사)',section,s,flags=re.S);assert n==1;p.write_text(s,'utf-8')
(A/'announcement-body.txt').write_text(html.unescape(re.sub('<[^>]+>','',s)),'utf-8')
p=A/'announcement-preview.html';s=p.read_text('utf-8');s,n=re.subn(r'<h2>2\.4\.1 세이브로 이어하기</h2>.*?(?=<hr><h2>버그 제보와 감사)',section.replace('<p><strong>【이미지 자리 ② — 02_auto_save_loading.png 첨부 / 게임에서 바로 불러오는 순서 안내】</strong></p>','<p><img src="02_auto_save_loading.png" alt="기존 세이브 바로 불러오기" style="max-width:100%"></p>'),s,flags=re.S);assert n==1;p.write_text(s,'utf-8')
p=A/'ATTACHMENT_GUIDE_KO.txt';s=p.read_text('utf-8').replace('02_save_compatibility.png','02_auto_save_loading.png').replace('세이브 이어하기의 이미지 자리②','게임에서 바로 불러오기 안내의 이미지 자리②');p.write_text(s,'utf-8')
old=A/'02_save_compatibility.png'
if old.exists():shutil.move(old,D/'retired-standalone/02_save_compatibility.png')
(A/'auto-save-loading.html').write_text('''<!doctype html><meta charset="utf-8"><title>2.4.2 기존 세이브 바로 불러오기</title><style>body{margin:0;background:#14202b;color:#f5e8ce;font:22px/1.6 "Malgun Gothic",sans-serif}main{max-width:1050px;padding:50px;margin:auto}h1{font-size:40px;color:#efc477;margin:0 0 12px}p{margin:12px 0}ol{padding-left:38px}li{padding:13px 18px;background:#233647;margin:10px 0;border-radius:8px}strong{color:#ffdc92}.foot{font-size:18px;color:#bfcbd5}</style><main><h1>기존 세이브로 바로 이어서</h1><p>2.4.1 일반 화면에서 저장한 세이브를 지원합니다.</p><ol><li>원래 세이브는 그대로 보관합니다.</li><li>세이브 파일을 새 2.4.2의 <strong>game/save</strong>에 복사합니다.</li><li>게임 실행 후 <strong>Game → Load</strong>로 불러옵니다.<br>필요한 보정은 불러올 때 자동으로 적용됩니다.</li><li><strong>새 이름으로 저장</strong>하고 계속 플레이합니다.</li></ol><p>별도 호환기 실행이나 사전 변환은 필요하지 않습니다.</p><p class="foot">직접 지은 이름·사용자 지정 이미지·육성·장비·관계·진행 기록 유지<br>지원 범위: 2.4.1 전투 밖 일반 화면 저장</p></main>''','utf-8')
p=R/'records/full242-packing-20261113/full242-package.py';s=p.read_text('utf-8').replace("records/full242-packing-20261113'","records/auto242-load-20261114'").replace('G:/Codex/tmp/full242-packing-20261113','G:/Codex/tmp/auto242-load-20261114').replace('JO9_2.4.2_Kor_Full_20261114.zip','JO9_2.4.2_Kor_Full_20261114_r2.zip');(D/'auto242-package.py').write_text(s,'utf-8')
print('Announcement instructions updated; r2 package script prepared.')
