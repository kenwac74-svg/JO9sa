const fs=require('fs'),path=require('path'),c=require('G:/somi/JO9sa/tools/text-workshop/core.cjs');
const T='G:/Codex/tmp/fog-audio-null-20261116',G='G:/somi/Jack O Nine Tails v2.4_work/game';fs.mkdirSync(T,{recursive:true});
if(!fs.existsSync(T+'/content'))fs.symlinkSync(G+'/content',T+'/content','junction');
fs.writeFileSync(T+'/config.xml','<game width="500" height="200" title="JO9 Audio Null Test"/>');
fs.writeFileSync(T+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=false\r\nAutosaveWhenExiting=false\r\n');
for(const mode of ['red','green']){
 const body="play 'girls/scene/Alexia/music',50,'loop'\r\n"+(mode==='red'?"close 'girls/scene/Alexia/music'\r\n":'')+"play 'content/snd/spires.mp3',50,'only, loop'\r\nmsg 'JO9_QA_AUDIONULL_"+mode+"_COMPLETE'";
 const raw=Buffer.from(['QSPGAME','audio test','',c.shift('1',-5),c.shift('Start',-5),'',c.shift(body,-5),c.shift('0',-5),''].join('\r\n'),'utf16le');
 c.parse(raw);fs.writeFileSync(T+'/'+mode+'.qsp',raw);
}
console.log(T);
