'use strict';
// Lexical state compatible with qspProcessPreformattedStrings in official engine-base qsp/codetools.cpp.
// Comments inside brace-quoted code are still scanned for quote delimiters by that preprocessing stage.
module.exports=function preformat(text){let quote='',depth=0,line=1,start=1,spans=[];for(let i=0;i<text.length;i++){
 const ch=text[i],newline=ch==='\r'&&text[i+1]==='\n';
 if(newline){if(!quote&&!depth){spans.push({start,end:line});start=line+1;i++;line++;continue;}line++;}
 if(quote){if(ch===quote){if(text[i+1]===quote)i++;else quote='';}}
 else if(ch==='{')depth++;else if(ch==='}'&&depth)depth--;else if(ch==="'"||ch==='"')quote=ch;
 }return {quote,depth,spans,line};};
