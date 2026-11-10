'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo='G:/somi/JO9sa',game='G:/somi/Jack O Nine Tails v2.4_work/game';
const core=require(repo+'/tools/text-workshop/core.cjs');
const input=process.argv[2]||game+'/jack.qsp',out=process.argv[3];
assert(out,'Usage: node probe.cjs <input.qsp> <diagnostic-directory>');
const raw=fs.readFileSync(input),d=core.parse(raw),loc=d.locations.find(l=>l.name==='#dynamic');assert(loc);
let dynamicBody=core.shift(d.lines[loc.body],5);
const play="play $music_now, music_volume, 'only, loop'";
assert.equal(dynamicBody.split(play).length-1,1);
// Diagnostic-only playback observation; production PLAY and its flags are unchanged.
dynamicBody=dynamicBody.replace(play,"qa_plays+=1 & $qa_play_path=$music_now & qa_play_volume=music_volume");
const start=`
gs '#dynamic'
$music['poor']='content/snd/city_poor.mp3'
$music['citizen']='content/snd/city_citizen.mp3'
$music['honor']='content/snd/city_honor.mp3'
$music['night']='content/snd/night.mp3'
$music['city']='content/snd/city.mp3'
$qa_keys[0]='poor'
$qa_keys[1]='citizen'
$qa_keys[2]='honor'
$qa_keys[3]='night'
$qa_keys[4]='city'
$qa_keys[5]=''
qa_checked=0
for qa_m=0 to 1 step 1:
 for qa_ctx=0 to 1 step 1:
  for qa_old_i=0 to 5 step 1:
   for qa_profile=0 to 4 step 1:
    sound_on=qa_m & music_volume=37 & sound_volume=62 & music_off=0
    city_form=iif(qa_ctx=1,1000,1)
    noble_status=0 & brand_reputation=0 & $estate='citizen_house'
    if qa_profile=0: $estate='slum_house'
    if qa_profile=2: noble_status=1 & $estate='slum_house'
    if qa_profile=3: brand_reputation=5 & $estate='slum_house'
    if qa_profile=4: brand_reputation=4
    $qa_old=$qa_keys[qa_old_i]
    $toplay=$qa_old & $music_now=$music[$qa_old]
    $qa_old_path=$music_now
    qa_plays=0 & $qa_play_path='' & qa_play_volume=0
    $qa_expected=$qa_old
    if qa_m=1 and (qa_ctx=0 or $qa_old='city' or $qa_old=''):
     if noble_status=1 or brand_reputation>=5:
      $qa_expected='honor'
     elseif $estate='slum_house':
      $qa_expected='poor'
     else
      $qa_expected='citizen'
     end
    end
    dynamic $city_sounds
    if $toplay!$qa_expected: msg 'FAIL music selection' & exit
    if qa_m=0 and (qa_plays!0 or $music_now!$qa_old_path): msg 'FAIL muted state' & exit
    if qa_m=1 and (qa_plays!1 or $qa_play_path!$music[$qa_expected] or $music_now!$music[$qa_expected]): msg 'FAIL playback route' & exit
    if qa_m=1 and qa_play_volume!37: msg 'FAIL playback volume' & exit
    if music_volume!37 or sound_volume!62 or music_off!0: msg 'FAIL volume setting' & exit
    qa_checked+=1
   end
  end
 end
end
if qa_checked!120: msg 'FAIL matrix count' & exit
msg 'JO9_QA_CITYSETTINGS_route_COMPLETE'
exit
`.trim().replace(/\r?\n/g,'\r\n');
const lines=['QSPGAME','','',core.shift('2',-5),core.shift('Start',-5),'',core.shift(start,-5),core.shift('0',-5),core.shift('#dynamic',-5),'',core.shift(dynamicBody,-5),core.shift('0',-5),''];
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(game+'/config.xml',out+'/config.xml');
fs.writeFileSync(out+'/FastQSP.ini','[General]\r\nignoreCRC=true\r\nmutedState=true\r\n');
const file=path.resolve(out,'city-settings.qsp');fs.writeFileSync(file,core.serialize({lines}));
fs.writeFileSync(out+'/plan.json',JSON.stringify([{name:'city-settings',file,marker:'JO9_QA_CITYSETTINGS_route_COMPLETE',checkpoint:'120 cases: settings/normal, mute, prior track, legacy city, blank, noble/reputation/home'}],null,2)+'\n');
console.log(JSON.stringify({inputSha256:d.hash,cases:120,plan:out+'/plan.json',productionPlaybackUnmodified:true}));
