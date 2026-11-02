'use strict';
const h=require('./harness.cjs');const {fs,assert,c,sc,rec,tmp,game,write,get,set,loadCandidate,isolate,actor,runFixture,roleView}=h;
const p=loadCandidate(process.argv[2]||h.root+'/2026-10-28_farid_consignment_storage.json'),d=c.parse(p.bytes),liveBefore=c.hash(fs.readFileSync(game+'/jack.qsp'));isolate(d);
// Full actual appraiser and trait builders execute; only rendering shell and image resolver are isolated.
set(d,'_layout','*clr');set(d,'interior_change',"$result=$args[1]");set(d,'jo9_seed_role_images',"$result=$args[2]");
let checks=0;const check=(s,n)=>{checks++;return `if (${s})=0: msg 'FAIL_CONSIGNMENT_PANEL_${n}' & exit\n`;},snap=n=>`savegame 'panel-${n}.sav'\n`;
let code="gs '#static_base'\ngs '#dynamic'\ngs '#static_txt'\n$onnewloc=''\n$counter=''\nnsfw=1\nnpc=1\n$npc_id='фарид_аукционщик'\n$npc_name[$npc_id]='QA_FARID'\n$place='slave_stage'\n$text[1]='QA_PAGE_ONE'\n$text[2]='QA_PAGE_TWO'\n$picture_type=''\nsparks=100\nfarid_debt=0\nfarid_potential_debt=100\njo9_farid_stored_valid=1\n";
code+=actor('jo9_farid_stored',44001,1)+"jo9_farid_stored['beauty']=4\njo9_farid_stored['base_beauty']=4\njo9_farid_stored['sensitivity']=3\njo9_farid_stored['temper']=2\njo9_farid_stored['intellect']=5\njo9_farid_stored['ego']=3\njo9_farid_stored['pride']=1\njo9_farid_stored['fat']=2\njo9_farid_stored['style']=2\njo9_farid_stored['boobs']=3\njo9_farid_stored_rate['beauty']=cont_atr_threshold[4]\n";
code+=actor('stock',44002,0)+"stock['beauty']=1\nstock['stamina']=1\nstock['sensitivity']=1\nstock['temper']=1\nstock['intellect']=1\nstock['ego']=1\nstock['pride']=0\nstock['exotic']=1\nstock['fat']=1\nstock['style']=1\nstock_rate['beauty']=cont_atr_threshold[1]\n$stock_name='QA_UNRELATED_STOCK'\n";
for(const [name,values]of Object.entries({beauty:[1,4],stamina:[1,4],sensitivity:[1,3],temper:[1,2],intellect:[1,5],ego:[1,3],pride:[0,1],exotic:[1,3],fat:[1,2],style:[1,2]}))for(const value of values)code+='$'+name+'['+value+"]='QA_"+name.toUpperCase()+'_'+value+"'\n";
code+="$stock_boobs2_txt[3]='QA_BOOBS_MAP'\n$slave_age_name[1]='QA_AGE_ONE'\n";for(let i=0;i<=10;i++)code+='$rating['+i+"]='QA_RANK_"+i+"'\n";
// Independently appraise a copy to determine the expected native crown rank.
code+="copyarr 'qa_expected_probe','jo9_farid_stored'\ncopyarr '$qa_expected_probe','$jo9_farid_stored'\ncopyarr 'qa_expected_probe_rate','jo9_farid_stored_rate'\nqa_expected_probe_state=1\nqa_expected_probe_type=jo9_farid_stored_type\n$qa_expected_probe_psy_status=$jo9_farid_stored_psy_status\nis_stock=1\ngs '$slave_price','qa_expected_probe'\nqa_expected_rank=rating\n";
code+=snap('before')+"$master_head_gear='raven_crown'\n$interaction_type='drop_to_farid'\ninteraction_city=119\ntxt=2\ngs 'interaction_screen_city'\n$qa_crown_html=$maintxt\n";
code+=check("instr($qa_crown_html,'QA_BEAUTY_4')>0 and instr($qa_crown_html,'QA_STAMINA_4')>0 and instr($qa_crown_html,'QA_INTELLECT_5')>0",'stored_attributes');
code+=check("instr($qa_crown_html,'천재')>0 and instr($qa_crown_html,'투기장 챔피언')>0",'stored_traits_and_history');
code+=check("instr($qa_crown_html,'QA_RANK_'+$str(qa_expected_rank))>0 and instr($qa_crown_html,'QA_AGE_ONE')>0",'native_crown_rank');
code+=check("instr($qa_crown_html,'QA_BOOBS_MAP')>0 and $stock_boobs2_txt[3]='QA_BOOBS_MAP'",'shared_map_name_preserved');
code+=check("instr($qa_crown_html,'jo9_farid_viewprobe')=0 and instr($special_image[3],'QA_IMAGE_44001')>0",'retained_links_and_picture');
code+=check("jo9_farid_viewprobe_state=0 and arrsize('jo9_farid_viewprobe')=0 and $jo9_farid_viewprobe_features_list=''",'temporary_cleanup');
code+=check("sparks=100 and farid_potential_debt=100 and jo9_farid_stored_valid=1",'view_no_transaction')+snap('after-crown');
code+="$master_head_gear=''\ngs 'interaction_screen_city'\n$qa_plain_html=$maintxt\n";
code+=check("instr($qa_plain_html,'QA_BEAUTY_4')>0 and instr($qa_plain_html,'QA_INTELLECT_5')>0 and instr($qa_plain_html,'QA_RANK_')=0",'plain_attributes_without_crown_rank');
code+=check("instr($qa_plain_html,'천재')=0",'plain_visibility_rule_preserved');
code+=check("jo9_farid_viewprobe_state=0 and arrsize('jo9_farid_viewprobe')=0 and $jo9_farid_viewprobe_features_list=''",'plain_temporary_cleanup')+snap('after-plain');
code+="txt=1\nnpc=1\ngs 'interaction_screen_city'\n"+check("instr($maintxt,'QA_FARID')>0 and instr($maintxt,'QA_BEAUTY_4')=0",'first_page_npc_panel')+snap('after-first-page');
code+="jo9_farid_stored_valid=0\ntxt=2\n"+snap('legacy-before')+"gs 'interaction_screen_city'\n";
code+=check("instr($maintxt,'보관 기록을 확인할 수 없습니다')>0 and instr($maintxt,'QA_BEAUTY_1')=0",'legacy_does_not_misidentify_shared_stock');
code+=check("sparks=100 and farid_potential_debt=100 and jo9_farid_stored_valid=0",'legacy_view_preserves_money')+snap('legacy-after');
// Existing hunting first_point must still render the actual shared stock, not Farid custody.
code+="jo9_farid_stored_valid=1\n$interaction_type='hunting_trophy'\ninteraction_city=61120\ntxt=1\n$master_head_gear=''\ngs 'interaction_screen_city'\n";
code+=check("instr($stock_attrib_list,'QA_BEAUTY_1')>0 and instr($stock_attrib_list,'QA_BEAUTY_4')=0",'hunting_panel_unchanged');
code+=snap('after-hunting');
const native=runFixture(d,'green-panel',code),comparisons=[];
const saved=n=>sc.parse(fs.readFileSync(tmp+'/panel-'+n+'.sav'));
function same(a,b,role,label){assert.deepEqual(roleView(saved(a),role),roleView(saved(b),role),label);comparisons.push(label);}
if(native.results.every(r=>r.pass)){
 for(const after of ['after-crown','after-plain','after-first-page'])for(const role of ['jo9_farid_stored','stock'])same('before',after,role,after+'_'+role);
 for(const role of ['jo9_farid_stored','stock'])same('legacy-before','legacy-after',role,'legacy_'+role);
 same('before','after-hunting','jo9_farid_stored','hunting_keeps_stored');
 const s=saved('after-crown');for(const template of h.schema(s)){const name=template.replaceAll('instance','jo9_farid_viewprobe').replace(/^\$/,'').toUpperCase();const v=s.vars.find(x=>x.name===name);assert(!v||v.values.length===0,'Probe residual '+name);}
}
const report={baseline:h.baseline,candidate:p.patch.after_sha256,checks,native,canonicalComparisons:comparisons,temporaryAll23Cleaned:native.results.every(r=>r.pass),worldUnchanged:c.hash(fs.readFileSync(game+'/jack.qsp'))===liveBefore,noOriginalSaveLoadedOrWritten:true,instrumentation:['Actual complete interaction_screen_city and actual price/trait builders execute.','Only layout shell and media path formatting isolated; real crown price is compared with independently appraised temporary copy.','Actual stored/stock canonical23groups compared before and after all panel paths.'],limits:['Engine-rendered HTML and data invariants; no physical GUI visual inspection.','Synthetic representative actor data, no personal save reload.']};write(rec+'/green-panel-results.json',report);console.log(JSON.stringify(report));assert(native.results.every(r=>r.pass)&&report.worldUnchanged);
