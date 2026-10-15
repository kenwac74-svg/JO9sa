const fs=require('fs'),assert=require('assert'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const d=c.parse(fs.readFileSync(process.argv[2]));const l=d.locations.find(l=>l.name==='shop_general'),b=c.shift(d.lines[l.body],5);
assert(b.includes('JO9_CRYO_PAGED_GRID_20261015'),'Cryo must use paginated cards');
assert(!b.includes('id = "cryo_ava_'),'No right-hand duplicate avatars');
assert(b.includes('jo9_cryo_page_size = 15'));
assert(b.includes('jo9_cryo_last = min(jo9_cryo_total, jo9_cryo_first + jo9_cryo_page_size - 1)'));
assert(b.includes('cryo_cell_selected = <<jo9_cryo_i>>'),'Portrait still opens its original cell details');
assert(b.includes('interaction_city = <<jo9_cryo_action>>'),'Cell action still uses original event');
assert(b.includes('jo9_cryo_action = 332011 + jo9_cryo_i'));
assert(b.includes('jo9_cryo_page -= 1')&&b.includes('jo9_cryo_page += 1'));
assert(b.includes('sp_txt = 1 & gt $curloc'));
assert(b.includes('width:230px;height:62px')&&b.includes('top:385px'));
if(process.argv[3]){const prev=c.parse(fs.readFileSync(process.argv[3]));for(let i=0;i<prev.lines.length;i++)if(i!==l.body)assert.equal(d.lines[i],prev.lines[i],'Only shop_general body may change');}
console.log('PASS: pagination, duplicate removal, detail/action routing, bounded grid, exact QSP scope');
