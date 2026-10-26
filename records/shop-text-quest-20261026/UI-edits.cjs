'use strict';
// Minimal edits only. Does not write the installed game or alter item effects/prices.
const fs=require('node:fs'),assert=require('node:assert/strict');
const c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const cr=s=>s.replace(/\r?\n/g,'\r\n');
function buildUiEdits(doc){
 const out=[];
 function edit(location,old,value){
  const loc=doc.locations.find(l=>l.name===location);assert(loc,'Missing '+location);
  const body=c.shift(doc.lines[loc.body],5);old=cr(old);value=cr(value);
  assert.equal(body.split(old).length-1,1,'Unique UI source: '+location);
  out.push({location,field:'body',old,new:value,count:1});
 }
 const old="\t\tfunc('$menu', 'interaction_city', $menu_item_milk_tip, menu_milk_tip, '내일의 우유 가격을 묻는다 ($0~5)')";
 edit('#options',old,"! JO9 MOD START MILK_TIP_LABEL_FIT_20261026\n"+old.replace(' ($0~5)','')+"\n! JO9 MOD END MILK_TIP_LABEL_FIT_20261026");
 const scene="*p func('$menu', 'layout_style')";
 edit('shop_general',scene,`! JO9 MOD START MILK_TIP_SAVED_LABEL_20261026
! Old saves may retain the former label in $display_options; preserve the existing question link.
if $place = 'milk_cooperative': $text_display = replace($text_display, '내일의 우유 가격을 묻는다 ($0~5)', '내일의 우유 가격을 묻는다')
! JO9 MOD END MILK_TIP_SAVED_LABEL_20261026
${scene}`);
 const render="*p '<div id = \"main_screen\"><<$text_display>></div>'";
 edit('main_screen',render,`! JO9 MOD START HOME_POTION_COLUMNS_20261026
if menu_form = menu_potion_S or menu_form = menu_potion_S_assistant:
 *p '<div id="main_screen" class="jo9_home_potions"><<$text_display>></div>'
else
${render}
end
! JO9 MOD END HOME_POTION_COLUMNS_20261026`);
 const builder="! Creates a link to something";
 edit('$menu',builder,`! JO9 MOD START PHARMACY_GRAY_HTML_20261026
! Native saves may restore old icon HTML; repair only the missing style attribute at the common input.
if instr($args[1], '<li id="grey" ="background:') > 0: $args[1] = replace($args[1], '<li id="grey" ="background:', '<li id="grey" style="background:')
! JO9 MOD END PHARMACY_GRAY_HTML_20261026

${builder}`);
 return out;
}
function buildUiAssetEdits(){
 const out=[],game='G:/somi/Jack O Nine Tails v2.4_work/game';
 const iconPath='json/menu_icon.json',icons=fs.readFileSync(game+'/'+iconPath,'utf8');
 const keys=['Philtrepotion','BacchicNectar','TonicElixir','MiracleBalm','Aphrodisiac','PowerfulAphrodisiac','WaterofLethe','metabolism_plus','metabolism_minus','zhir_plus','zhir_minus'];
 for(const key of keys){const name='menu_item_'+key+'_gray',rx=new RegExp('^.*"'+name+'".*$','m'),old=icons.match(rx)?.[0];assert(old&&old.includes('id=\\"grey\\" =\\"'),'Expected malformed icon: '+name);out.push({path:iconPath,old,new:old.replace('id=\\"grey\\" =\\"','id=\\"grey\\" style=\\"'),count:1});}
 const cssPath='css/base.css',css=fs.readFileSync(game+'/'+cssPath,'utf8');
 const stock=css.match(/#barn_milk_can_stock \{\r?\n[\s\S]*?\r?\n\}/)?.[0];assert(stock&&stock.includes('left:1183px;'));
 out.push({path:cssPath,old:stock,new:'/* JO9 MOD START MILK_STOCK_CENTER_20261026 */\r\n'+stock.replace('left:1183px;','left:1125px;\r\nwidth:85px;')+'\r\n/* JO9 MOD END MILK_STOCK_CENTER_20261026 */',count:1});
 const anchor='/* JO9 MOD END ROOM_TUTOR_LAYOUT */';assert.equal(css.split(anchor).length-1,1);
 out.push({path:cssPath,old:anchor,new:anchor+cr(`

/* JO9 MOD START HOME_POTION_COLUMNS_20261026 */
/* The slave and assistant potion columns share the left column's existing 63px offset. */
#main_screen.jo9_home_potions > .menu_column_0,
#main_screen.jo9_home_potions > .menu_column_1{position:absolute;top:63px;}
/* JO9 MOD END HOME_POTION_COLUMNS_20261026 */`),count:1});
 return out;
}
module.exports={buildUiEdits,buildUiAssetEdits};
