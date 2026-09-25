# jack.qsp(QSPGAME UTF-16LE)의 모든 location을 텍스트로 풀어 JSON으로 저장하는 스크립트
import sys, json
def sh(s, d): return ''.join(chr((ord(c)+d) & 0xFFFF) for c in s)
data = open(sys.argv[1], 'rb').read().decode('utf-16-le')
f = data.split('\r\n')
assert f[0] == 'QSPGAME'
n = int(sh(f[3], 5)); at = 4; locs = []
for _ in range(n):
    name, desc, body = (sh(f[at+i], 5) for i in range(3))
    acts = int(sh(f[at+3], 5))
    actions = [[sh(f[at+4+j*3+i], 5) for i in range(3)] for j in range(acts)]
    locs.append({'name': name, 'desc': desc, 'body': body, 'actions': actions})
    at += 4 + acts*3
assert at == len(f)-1 and f[at] == ''
json.dump(locs, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False)
print(n, 'locations')
