'use strict';
const {fs,path,root,game,resources}=require('./root-kit.cjs');
const out=root+'/gui';resources(out,true);
fs.copyFileSync(root+'/source.qsp',out+'/jack.qsp');
fs.mkdirSync(out+'/save',{recursive:true});
fs.writeFileSync(out+'/provenance.json',JSON.stringify({source:game+'/jack.qsp',resources:['content','css','fonts','json'].map(p=>({junction:out+'/'+p,target:game+'/'+p})),savePolicy:'Only task-local outputs. Original saves opened read-only from file dialog.'},null,2));
console.log(out);
