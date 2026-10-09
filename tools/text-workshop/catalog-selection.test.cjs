const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {select}=require('./catalog-selection.cjs');
test('QSP case resolves actual entry without mixing scene and characters',()=>{
 const root=fs.mkdtempSync(path.join(__dirname,'case-selection-'));
 for(const folder of ['characters','scene']){fs.mkdirSync(path.join(root,'content','pic',folder),{recursive:true});fs.writeFileSync(path.join(root,'content','pic',folder,'sultan.png'),'image');}
 const rows=['content/pic/characters/sultan.png','content/pic/scene/sultan.png'];const catalog={meta:p=>rows.includes(p)?{path:p}:null};
 assert.equal(select(root,catalog,'content/pic/characters/Sultan.png'),rows[0]);
 assert.equal(select(root,catalog,rows[1]),rows[1]);assert.equal(select(root,catalog,'content/pic/other/Sultan.png'),null);assert.equal(select(root,catalog,'content/pic/../Sultan.png'),null);
 const exact={meta:p=>p==='content/pic/characters/Sultan.png'?{path:p}:null};assert.equal(select(root,exact,'content/pic/characters/Sultan.png'),'content/pic/characters/Sultan.png');
});
