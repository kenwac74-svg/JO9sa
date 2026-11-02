const fs=require('fs'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');const out={inputs:{},mechanics:{current:[],original:[]}};
for(const [label,input]of Object.entries({current:'G:/somi/Jack O Nine Tails v2.4_work/game/jack.qsp',original:'G:/somi/JO9O/game/jack.qsp'})){
 const d=c.parse(fs.readFileSync(input));out.inputs[label]={path:input,sha256:d.hash};
 for(const l of d.locations){const a=c.shift(d.lines[l.body],5).split(/\r?\n/);let ranges=[];
 if(l.name==='interaction_city'){
  for(const [start,end]of [['if interaction_city = 119:','if interaction_city = 1192:'],['if interaction_city = 1193:','if interaction_city = 12:']]){const b=a.findIndex(s=>s===start),e=a.findIndex((s,i)=>i>b&&s===end);if(b>=0)ranges.push([b,e>b?e:Math.min(b+18,a.length)]);}
  for(let i=0;i<a.length;i++)if(/dynamic \$clear_slave_instance, 'stock'/.test(a[i])&&i<5500)ranges.push([Math.max(0,i-2),Math.min(a.length,i+4)]);
 }
 if(l.name==='generate_stock')ranges.push([0,10]);
 if(l.name==='stock_to_slave'||l.name==='stock_to_slave_nogt')ranges.push([0,a.length]);
 if(l.name==='slave_auction_buy'||l.name==='slave_auction_sell')ranges.push([0,27]);
 if(l.name==='next_day'){const i=a.findIndex(s=>s.includes('farid_debt += farid_potential_debt'));ranges.push([i,i+2]);}
 if(l.name==='#options'){const i=a.findIndex(s=>s.includes('menu_prize_sell'));ranges.push([i,i+1]);}
 if(l.name==='#static_base'){
  const b=a.findIndex(s=>s==='$swap_slave_instances = {'),e=a.findIndex((s,i)=>i>b&&s==='$clear_slave_instance = {');ranges.push([b,e]);
  const z=a.findIndex(s=>s==="killvar '$slave_vars'");ranges.push([z,z+22]);
 }
 if(l.name==='выход_из_боя'){const i=a.findIndex(s=>s==='if get_girl = 1:');ranges.push([i,i+5]);}
 if(l.name==='$guild_auction'){for(let i=0;i<a.length;i++)if(/interaction_city = 931/.test(a[i]))ranges.push([i-2,i+2]);}
 for(const[b,e]of ranges)for(let i=Math.max(0,b);i<Math.min(e,a.length);i++){const s=a[i];if(/\$text\[|\$sp_text|\$auction_flow|\$auction_hammer/.test(s)||/^\s*'<|^\s*\$special_image/.test(s))continue;out.mechanics[label].push({location:l.name,line:i+1,code:s});}
 }
}
fs.writeFileSync(__dirname+'/evidence.json',JSON.stringify(out,null,2));
for(const label of Object.keys(out.mechanics)){console.log(label);for(const x of out.mechanics[label])if(/if interaction_city = 119|gs 'stock_to_slave'|stock_state !|swap_slave_instances, 'slave', 'stock'|farid_potential_debt = 0|farid_debt \+= farid_potential/.test(x.code))console.log(x.location+':'+x.line+' '+x.code);}
