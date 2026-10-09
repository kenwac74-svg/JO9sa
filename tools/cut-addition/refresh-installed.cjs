const path=require('node:path');
const project='C:/Users/Ken Choung/Documents/Codex/2026-10-06/task/JO9sa',game='C:/MOVE/Jack O Nine Tails v2.3 Kor_nosex/game',catalogRoot=path.join(project,'tools/local-workspace/catalog'),runtime=path.join(project,'tools/local-workspace/runtime');
const catalog=require(path.join(project,'tools/text-workshop/catalog.cjs')).create(catalogRoot);
const api=require(path.join(project,'tools/text-workshop/image-cuts.cjs')).create(game,catalogRoot,catalog,runtime);
console.log(JSON.stringify(api.refresh('2026-10-08_windows_cut_names')));
console.log(JSON.stringify(api.info('characters/Tsyuansu.png')));
