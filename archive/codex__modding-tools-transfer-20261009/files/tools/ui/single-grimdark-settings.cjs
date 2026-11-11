'use strict';
const assert=require('node:assert/strict');
const locked=new Set(['$newloc','_layout','main_layout','stats_layout','main_screen','city_screen','раскладка_бой','menu_form','city_menu_form']);
function body(name,source){
 let next=source;
 if(['menu_form','city_menu_form'].includes(name)){
  const start=next.indexOf("\t$setting_display += '<div id=\"under\">< 배경 설정 ></div>'");
  const end=next.indexOf("\t$setting_display += '<br><br><div id=\"under\">< < 자동 저장 설정",start);
  assert(start>=0&&end>start,'Expected exactly one settings style section');
  const replacement=["\t$setting_display += '<div id=\"under\">< CG 스타일 ></div>'",...Array(3).fill("\t$setting_display += '<div id=\"under_gray\" aria-disabled=\"true\" title=\"개발중\">개발중<br></div>'")].join('\r\n')+'\r\n';
  next=next.slice(0,start)+replacement+next.slice(end);
 }
 if(['main_screen','city_screen'].includes(name)){
  const flag=name==='main_screen'?'menu_form = 2000':'city_form = 1000';
  const old="*p '<div id = \"settings_ex\"><<$setting_display_c>></div>'";
  const re=/^(\s*)\*p '<div id = "settings_ex"><<\$setting_display_c>><\/div>'/gm;
  let count=0;next=next.replace(re,(_,indent)=>{count++;return indent+old.replace('settings_ex"','settings_ex" style="left:<<iif('+flag+',570,100)>>px"');});
  assert.equal(count,1,'Expected one active options Back container');
 }
 if(locked.has(name)&&!next.startsWith('ui_style = 2\r\n'))next='ui_style = 2\r\n! JO9_SINGLE_GRIMDARK_UI_20261014\r\n'+next;
 return next;
}
const frame=`\r\n/* JO9_SINGLE_GRIMDARK_UI_20261014_BEGIN */
/* Paint only: existing geometry and hit boxes remain unchanged. */
body:before,body:after{content:"";position:fixed;display:block;pointer-events:none;z-index:900;background-image:url('content/pic/ui/grimdark/bg_main.png');background-repeat:no-repeat;}
/* Reuse the existing vertical metal strip in the vacant left gutter. */
body:before{left:0;top:45px;width:8px;height:755px;background-size:640px 800px;background-position:-501.5px -45px;}
/* Close the bottom outer edge with the existing horizontal metal strip. */
body:after{left:0;top:792px;width:1003px;height:8px;background-size:1280px 400px;background-position:0 -15px;}
/* JO9_SINGLE_GRIMDARK_UI_20261014_END */\r\n`;
function css(source){assert(!source.includes('JO9_SINGLE_GRIMDARK_UI_20261014_BEGIN'),'Already patched CSS');return source+frame;}
module.exports={body,css,frame};
