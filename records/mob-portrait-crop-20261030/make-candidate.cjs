'use strict';
const fs=require('fs'),a=require('assert/strict'),H=__dirname,R='G:/somi/JO9sa/tools/mob-image-sets';
const before=fs.readFileSync(R+'/catalog-mob-sets.js','utf8');let next=before;
const old="const expected=sizeFor(kind),normalized=await normalizePng(file,data,w,h,expected);data=normalized.data;";
const changed="const expected=sizeFor(kind),normalized=kind==='portrait'?await window.JO9MobPortraitCrop.open({file,path:slot.path,shared:slot.shared,frameClass:slot.frameClass||'default'}):await normalizePng(file,data,w,h,expected);if(!normalized)return;data=normalized.data;";
a.equal(next.split(old).length-1,1);next=next.replace(old,changed);
next=next.replace("const approved=await new Promise(resolve=>", "const approved=kind==='portrait'?true:await new Promise(resolve=>");
next=next.replace("if(key==='portrait'&&slot.frameLabel)box.append(node('p','프레임: '+slot.frameLabel));", "if(key==='portrait'&&slot.frameLabel)box.append(node('p','프레임: '+slot.frameLabel+' · 얼굴 선택 후 자동 적용'));");
next=next.replace("'저장 크기 '+standard.width+'×'+standard.height+' · 자동 조절'", "'저장 크기 '+standard.width+'×'+standard.height+(key==='portrait'?' · 얼굴 영역 선택·프레임 자동 적용':' · 자동 조절')");
// Keep the existing final preview for standing/defeat only. Portrait editor already contains its final approval.
next=next.replace("dialog.append(node('h3',role", "dialog.append(node('h3',role");
next=next.replace("document.body.append(dialog);\n    const approved", "if(kind!=='portrait')document.body.append(dialog);\n    const approved");
const frames=JSON.parse(fs.readFileSync(H+'/frame-data.json')),editor=fs.readFileSync(H+'/portrait-crop.js','utf8');
const assets='/* JO9 MOD START MOB_PORTRAIT_CROP_ASSETS_20261030 */\nwindow.JO9_MOB_PORTRAIT_FRAMES='+JSON.stringify(frames).replaceAll('<','\\u003c')+';\n'+editor.trim()+'\n/* JO9 MOD END MOB_PORTRAIT_CROP_ASSETS_20261030 */\n';
const firstLine=next.indexOf('\n')+1;next=next.slice(0,firstLine)+assets+next.slice(firstLine);
fs.writeFileSync(H+'/catalog-before.js',before);fs.writeFileSync(H+'/catalog-mob-sets.js',next);new(require('vm').Script)(next);console.log('CANDIDATE_PREPARED');
