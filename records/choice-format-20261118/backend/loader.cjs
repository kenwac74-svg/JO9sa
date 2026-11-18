'use strict';
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const canonical=path.resolve('G:/somi/JO9sa/tools/text-workshop'),stage=path.resolve(process.env.JO9_CHOICE_FORMAT_STAGE||__dirname),resolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...args){
 if(request.startsWith('.')&&parent?.filename){
  const local=path.resolve(path.dirname(parent.filename),request),replacement=path.join(stage,path.basename(local));
  if(local.startsWith(canonical+path.sep)&&fs.existsSync(replacement))return replacement;
  if(parent.filename.startsWith(stage+path.sep)&&!fs.existsSync(local))return resolve.call(this,path.resolve(canonical,request),parent,...args);
 }
 return resolve.call(this,request,parent,...args);
};
