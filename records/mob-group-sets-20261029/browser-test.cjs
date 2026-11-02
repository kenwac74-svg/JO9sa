'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),a=require('assert/strict');
const {chromium}=require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const repo='G:/somi/JO9sa',tmp=fs.mkdtempSync('G:/Codex/tmp/mob-group-sets-20261029/browser-'),game=tmp+'/game',cat=tmp+'/catalog',core=require(repo+'/tools/text-workshop/core.cjs');
async function main(){
 fs.mkdirSync(game+'/content/pic/mob/defeated',{recursive:true});fs.mkdirSync(cat,{recursive:true});
 const m=JSON.parse(fs.readFileSync(__dirname+'/manifest.json'));
 const e=JSON.parse(JSON.stringify(m.entries.find(e=>e.key==='ogre')));e.name='검사 몬스터';e.defeat.path='content/pic/mob/defeated/groups/medic_group.png';const g=JSON.parse(JSON.stringify(m.groups[0]));g.members.forEach(x=>x.portrait=null);g.defeat.path=e.defeat.path;
 const original=fs.readFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/'+e.standing.path);fs.writeFileSync(game+'/'+e.standing.path,original);if(e.portrait){fs.mkdirSync(path.dirname(game+'/'+e.portrait.path),{recursive:true});fs.copyFileSync('G:/somi/Jack O Nine Tails v2.4_work/game/'+e.portrait.path,game+'/'+e.portrait.path);}
 const rows=[e.portrait,e.standing,e.defeat].filter(Boolean).map(s=>[s.path.replaceAll('/','\\'),'a','etc',0,0,s.width||795,s.height||596,'']);
 fs.writeFileSync(cat+'/catalog_merge_vs_original.html','<html><body><script>var D='+JSON.stringify(rows)+';\nvar MR="fixture",OR="fixture";</script></body></html>');
 const catalog=require(repo+'/tools/text-workshop/catalog.cjs').create(cat),pic=require(repo+'/tools/text-workshop/pic-local.cjs').create(game,cat,catalog);
 let calls=0;const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');if(u.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<div id="main"></div><script>window.JO9_CATALOG_BRIDGE={url:location.origin+"/",token:"fixture"};window.JO9_MOB_SETS='+JSON.stringify({entries:[],groups:[g]})+';</script><script>'+fs.readFileSync(__dirname+'/catalog-mob-sets.js','utf8')+'</script>');return;}
 if(u.pathname==='/api/pic'){const p=u.searchParams.get('p');a(!p.includes('..'));const f=game+'/content/pic/'+p;if(!fs.existsSync(f)){res.statusCode=404;res.end();return;}res.setHeader('Content-Type','image/png');res.end(fs.readFileSync(f));return;}
 a.equal(req.headers['x-jo9-token'],'fixture');let data='';for await(const b of req)data+=b;const v=data?JSON.parse(data):{};let result;
 if(u.pathname.endsWith('/index'))result={index:pic.scan(true)};
 else if(u.pathname.endsWith('/file'))result=pic.file(v.path);
 else if(u.pathname.endsWith('/apply')){calls++;result=pic.apply(v.jobs);}
 else throw Error('Unknown request');res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));
 }catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}));}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto('http://127.0.0.1:'+server.address().port+'/?mobsets=1');await page.waitForFunction(()=>document.querySelectorAll('#jo9-mob-sets section').length===1);
 a.match(await page.locator('#jo9-mob-sets').innerText(),/제작 필요/);
 const bytes=await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=795;c.height=596;c.getContext('2d').fillRect(0,0,795,596);return c.toDataURL().split(',')[1];});const png=Buffer.from(bytes,'base64');
 let chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'단체 PNG 추가'}).click();await(await chooser).setFiles({name:'test.png',mimeType:'image/png',buffer:png});await page.getByRole('button',{name:'WORK에 반영'}).waitFor();await page.getByRole('button',{name:'취소',exact:true}).click();a.equal(calls,0);a(!fs.existsSync(game+'/'+e.defeat.path));
 chooser=page.waitForEvent('filechooser');await page.getByRole('button',{name:'단체 PNG 추가'}).click();await(await chooser).setFiles({name:'test.png',mimeType:'image/png',buffer:png});await page.getByRole('button',{name:'WORK에 반영'}).click();await page.waitForFunction(()=>document.querySelector('#jo9-mob-sets').textContent.includes('반영 완료:'));
 a.equal(calls,1);a(fs.readFileSync(game+'/'+e.defeat.path).equals(png));a(fs.readFileSync(game+'/'+e.standing.path).equals(original));a.equal(JSON.parse(fs.readFileSync(cat+'/image_work/personal-patch/events.jsonl','utf8').trim()).files[0].path,'mob/defeated/groups/medic_group.png');
 await page.locator('#jo9-mob-sets input[type=checkbox]').check();a.equal(await page.locator('#jo9-mob-sets section').count(),0);await page.locator('#jo9-mob-sets input[type=checkbox]').uncheck();
 // Exercise the exact QSP HTML fallback, without resizing or hiding other UI.
 await page.evaluate(()=>{const img=document.createElement('img');img.id='fallback-check';img.setAttribute('data-standing','/api/pic?p=mob/ogre.png');img.setAttribute('onerror','this.onerror=null;this.src=this.getAttribute("data-standing")');img.src='/api/pic?p=mob/absent.png';document.body.append(img);});
 await page.waitForFunction(()=>{const x=document.getElementById('fallback-check');return x.complete&&x.naturalWidth>0;});a.equal(errors.length,0,errors.join('\n'));
 const patch=require('./patch.json'),source=patch.edits.find(e=>e.location==='конец_боя').new;
 const html=source.split('\r\n').find(l=>l.includes('id="jo9-group-defeat"')).match(/\*p '(.*)'/)[1];
 for(const ok of [true,false]){
  await page.evaluate(({html,ok})=>{const old=document.getElementById('test-group');if(old)old.remove();const wrap=document.createElement('div');wrap.id='test-group';wrap.innerHTML=html.replace('<<$jo9_mg_image>>',ok?'/api/pic?p=mob/defeated/groups/medic_group.png':'/api/pic?p=mob/absent.png')+'<div id="test-fallback">fallback</div>';document.body.append(wrap);},{html,ok});
  await page.waitForFunction(ok=>ok?document.getElementById('test-fallback').style.display==='none':document.getElementById('jo9-group-defeat').style.display==='none',ok);
 }
 a.equal(errors.length,0,errors.join('\n'));
 fs.writeFileSync(__dirname+'/browser-report.json',JSON.stringify({pass:true,checks:['catalog panel and missing status','cancel preserves files','upload creates same-name defeat file','standing preserved','personal patch ledger recorded','missing filter refresh','QSP error fallback loads standing','group image success hides individual fallback','missing group preserves individual fallback','no page exceptions'],productionWrites:false},null,2));console.log('Browser and real PIC writer fixture PASS');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
}
main().catch(e=>{console.error(e);process.exit(1);});


