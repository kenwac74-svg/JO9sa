'use strict';
// Canonical templates retain the data patterns used by existing catalog writers.
// HTTP clients receive only the shell, then request a selected tab's template.
const KEYS=new Set(['gallery','girls','pack','mob','notes','conditions']);
const templates=/<template id="jo9-catalog-module-([\w-]+)">([\s\S]*?)<\/template>/g;
function native(html){return html.includes('<nav id="jo9CatalogTabs"');}
function shell(html){return native(html)?html.replace(templates,''):html;}
function payload(html,key,http=false){
 if(!KEYS.has(key))return null;
 for(const m of html.matchAll(templates))if(m[1]===key)return http?m[2].replace(/<script src="catalog_workshop_config\.js"><\/script>/g,''):m[2];
 return null;
}
module.exports={native,shell,payload};
