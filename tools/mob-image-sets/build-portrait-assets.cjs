'use strict';
// Rebuild only the generated frame/editor block; preserve the surrounding MOB UI.
const fs=require('fs'),path=require('path'),a=require('assert/strict'),root=__dirname;
const target=path.join(root,'catalog-mob-sets.js'),before=fs.readFileSync(target,'utf8'),data=JSON.parse(fs.readFileSync(path.join(root,'frame-data.json'),'utf8')),editor=fs.readFileSync(path.join(root,'portrait-crop.js'),'utf8').trim();
const pattern=/\/\* JO9 MOD START MOB_PORTRAIT_CROP_ASSETS_20261030[\s\S]*?\/\* JO9 MOD END MOB_PORTRAIT_CROP_ASSETS_20261030 \*\//;a(pattern.test(before),'Generated block is missing');
const block='/* JO9 MOD START MOB_PORTRAIT_CROP_ASSETS_20261030 */\nwindow.JO9_MOB_PORTRAIT_FRAMES='+JSON.stringify(data).replaceAll('<','\\u003c')+';\n'+editor+'\n/* JO9 MOD END MOB_PORTRAIT_CROP_ASSETS_20261030 */',after=before.replace(pattern,()=>block);
if(process.argv.includes('--write'))fs.writeFileSync(target,after);else a.equal(after,before,'Run --write after reviewing helper/frame changes');
console.log(after===before?'BUNDLE_CURRENT':'BUNDLE_REBUILT');
