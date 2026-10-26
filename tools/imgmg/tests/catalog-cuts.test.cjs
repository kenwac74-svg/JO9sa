'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const tools=path.resolve(__dirname,'../..');
function boot({catalog=true,paths=[]}={}){
 const opened=[];const cards=paths.map(p=>({dataset:{screenCard:p},children:[],classList:{contains:()=>false},querySelector(){return this.children.find(x=>x.dataset?.jo9Cut)||null;},appendChild(b){this.children.push(b);}}));
 const window={JO9_CATALOG_BRIDGE:catalog?{url:'http://127.0.0.1:3813/',token:'fixture'}:null,JO9Workshop:{state:{rows:[]},refreshCuts(){},async beginCut(base,row){opened.push({base,row});return base;}},rowHtml:d=>'<div class="row">'+d[0]+'</div>'};
 const document={body:{},addEventListener(){},querySelectorAll(){return cards;},createElement(){return{dataset:{},type:'',textContent:''};},getElementById(){return null;}};
 const context=vm.createContext({window,document,location:{protocol:'http:',hostname:'127.0.0.1',port:catalog?'3813':'1057'},MutationObserver:class{observe(){}},setTimeout,console});
 vm.runInContext(fs.readFileSync(path.join(tools,'imgmg/catalog_cuts.js'),'utf8'),context);
 return{window,cards,opened};
}
test('catalog provides the cut editor entry for monster PNGs and preserves previous folders',async()=>{
 const c=boot();
 for(const p of ['content\\pic\\mob\\Warg.png','content/pic/mob/ogre (2).png','mob/sub/Enemy.png','bg/teatr1.png','characters/kuklovod.png','scene/arena.png','reserve/scene/kept.png'])assert.match(c.window.rowHtml([p]),/전환 컷 추가/,p);
 for(const p of ['content/pic/ui/icon.png','content/pic/buttons/gear.png','mob/enemy.jpg'])assert.doesNotMatch(c.window.rowHtml([p]),/전환 컷 추가/,p);
 await c.window.JO9_CUTS.open('content/pic/mob/Warg.png');assert.equal(c.opened.length,1);assert.equal(c.opened[0].base,'content/pic/mob/Warg.png');
});
test('standalone workshop decorates monster cards on a dynamic local port',()=>{
 const c=boot({catalog:false,paths:['content/pic/mob/Warg.png','content/pic/bg/teatr1.png','content/pic/ui/icon.png']});
 assert.equal(c.cards[0].children.length,1);assert.equal(c.cards[0].children[0].dataset.jo9Cut,'content/pic/mob/Warg.png');assert.equal(c.cards[1].children.length,1);assert.equal(c.cards[2].children.length,0);
});
test('canonical workshop and catalog editor predicates include mob without enabling UI icons',()=>{
 const files=['image-workshop/place/JO9_Place_Workshop.html','cut-addition/workshop-cut-editor.js','local-workspace/catalog-seed/catalog_editor.js'];
 for(const rel of files){const text=fs.readFileSync(path.join(tools,rel),'utf8'),line=text.split(/\r?\n/).find(x=>x.startsWith('const cutEligible='));assert.ok(line,rel);const eligible=vm.runInNewContext(line+'\ncutEligible');assert.equal(eligible('content/pic/mob/Warg.png'),true,rel);assert.equal(eligible('content/pic/ui/icon.png'),false,rel);assert.equal(eligible('content/pic/characters/example.png'),true,rel);}
});
