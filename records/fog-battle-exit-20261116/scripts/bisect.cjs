const cp = require('child_process'), fs = require('fs');
const S = 'C:/Users/User/AppData/Local/Temp/claude/ddec3b5d9f3b2654/26c5ce10-f0bb-4ae9-af34-368e315e149b/scratchpad';
const loc = process.argv[2], n = Number(process.argv[3]), save = process.argv[4] || 'G:/Mod/안개순찰대.sav', phase = process.argv[5] || '2';
function reached(i) {
  const O = 'C:/Users/User/AppData/Local/Temp/fogbis_' + loc.replace(/\W/g, '') + '_' + i;
  fs.rmSync(O, { recursive: true, force: true });
  cp.execFileSync(process.execPath, [S + '/fogsave.cjs', 'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp', save, O], { env: { ...process.env, BISLOC: loc, BIS: String(i), PHASE: phase }, stdio: 'pipe' });
  try { cp.execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', 'G:/somi/JO9sa/tools/qa/run-client-smoke.ps1', '-Engine', 'G:/somi/Jack O Nine Tails v2.4_work/game/engine/jack.exe', '-Plan', O + '/plan.json', '-TimeoutSeconds', '20'], { stdio: 'pipe', timeout: 60000 }); } catch (e) {}
  const t = new TextDecoder('euc-kr').decode(fs.readFileSync(O + '/fs-stderr.log'));
  const m = [...t.matchAll(/showMessage\(\), str:\s+"([^"]*)"/g)].map(x => x[1]);
  return m.includes('BIS_REACHED');
}
let lo = 0, hi = n - 1, firstUnreached = n; // find first index not reached
while (lo <= hi) {
  const mid = (lo + hi) >> 1; const r = reached(mid);
  console.log('idx', mid, r ? 'reached' : 'NOT reached');
  if (r) lo = mid + 1; else { firstUnreached = mid; hi = mid - 1; }
}
console.log('first top-level statement NOT reached: index', firstUnreached, '(statement before it hangs)');
