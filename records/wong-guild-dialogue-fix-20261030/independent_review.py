"""Read-only review of the narrowly approved Wong end-day dialogue repair.

Usage: python independent_review.py --before <QSP> --candidate <QSP>
Only this output directory receives a JSON report. No game/save/catalog writes.
"""
import argparse,datetime,difflib,hashlib,json,re,runpy,sys
from pathlib import Path

sys.dont_write_bytecode=True
READ=runpy.run_path('G:/somi/JO9sa/tools/qsp_dump.py')['read_locations']
HERE=Path(__file__).resolve().parent
LOCATION='end_day_screen'

def sha(b):return hashlib.sha256(b).hexdigest()
def need(c,m):
    if not c:raise AssertionError(m)
def block(lines):
    start=next(i for i,s in enumerate(lines) if s.strip()=='if end_day_guild_visit = 0:')
    end=next(i for i in range(start,len(lines)) if lines[i].strip().startswith('elseif sold_ill_slave'))
    return start,end
def scalar_text_write(s):
    return bool(re.match(r'^\$text\s*(?:\+?=)',s)) or bool(re.match(r'^if\s+\$text\[3\]\s*!\s*[\'\"]{2}\s*:\s*\$text\s*\+=',s,re.I))
def display_line(s):return bool(re.match(r'^\$text\[\d+\]\s*\+?=',s)) or scalar_text_write(s)
def control(lines):
    result=[]
    for s in lines:
        s=s.strip()
        if not s or s.startswith('!') or display_line(s):continue
        s=s.split('&!')[0].rstrip()
        # The approved fatal repair changes only the displayed string argument,
        # not the game-over call or its conditions/state behavior.
        if s=='dynamic $death, $text[3]':s='dynamic $death, $text'
        result.append(s)
    return result
def unquote(s):
    # Remove quoted QSP literal content while respecting doubled quote escapes.
    out=[];i=0
    while i<len(s):
        if s[i] not in "'\"":out.append(s[i]);i+=1;continue
        q=s[i];i+=1
        while i<len(s):
            if s[i]==q:
                if i+1<len(s) and s[i+1]==q:i+=2;continue
                i+=1;break
            i+=1
        else:raise AssertionError('Unclosed quote in inserted display statement')
        out.append('LITERAL')
    return ''.join(out)

def main():
    p=argparse.ArgumentParser();p.add_argument('--before',required=True);p.add_argument('--candidate',required=True);args=p.parse_args()
    before=Path(args.before);candidate=Path(args.candidate);oldraw=before.read_bytes();newraw=candidate.read_bytes()
    old=READ(oldraw);new=READ(newraw);checks=[];details={}
    def check(name,fn):
        try:checks.append({'name':name,'pass':True,'detail':fn()})
        except Exception as e:checks.append({'name':name,'pass':False,'detail':type(e).__name__+': '+str(e)})
    def structure():
        need(len(old)==len(new),'location count changed')
        changed=[]
        for a,b in zip(old,new):
            need(a['name']==b['name'],'location order/name changed')
            need(a['desc']==b['desc'] and a['actions']==b['actions'],'location description/actions changed '+a['name'])
            if a['body']!=b['body']:changed.append(a['name'])
        need(changed==[LOCATION],'only end_day_screen may change: '+repr(changed));return {'locations':len(new),'changedBodies':changed,'newLocations':0,'actionsAndDescriptionsPreserved':True}
    check('QSP_structure_and_single_location_scope',structure)
    a=next(x for x in old if x['name']==LOCATION)['body'].split('\r\n');b=next(x for x in new if x['name']==LOCATION)['body'].split('\r\n')
    x0,x1=block(a);y0,y1=block(b);ob=a[x0:x1];nb=b[y0:y1]
    def scope():
        need(a[:x0]==b[:y0],'changes before Wong block')
        need(a[x1:]==b[y1:],'Angelika or later end-day code changed')
        return {'beforeBlockPreserved':True,'AngelikaAndFollowingCodePreserved':True,'oldWongLines':[x0+1,x1],'newWongLines':[y0+1,y1]}
    check('Wong_only_block_boundary',scope)
    added=[]
    def insertions():
        fatal_changes=0
        for tag,i,j,k,l in difflib.SequenceMatcher(a=ob,b=nb,autojunk=False).get_opcodes():
            if tag=='equal':continue
            if tag=='replace':
                old_payload=[s.strip() for s in ob[i:j] if s.strip() and not s.strip().startswith('!')]
                new_payload=[s.strip() for s in nb[k:l] if s.strip() and not s.strip().startswith('!')]
                if old_payload==['dynamic $death, $text'] and new_payload==['dynamic $death, $text[3]']:
                    fatal_changes+=1
                    for n in range(k,l):
                        if not nb[n].strip() or nb[n].strip().startswith('!'):added.append({'line':y0+n+1,'text':nb[n]})
                    continue
            need(tag=='insert','Existing code/dialogue was removed or rewritten: '+tag+' old '+str((i,j)))
            for n in range(k,l):
                s=nb[n].strip();added.append({'line':y0+n+1,'text':nb[n]})
                if not s or s.startswith('!'):continue
                need(scalar_text_write(s),'Inserted executable statement is not an approved scalar-text merge: '+s)
                expression=unquote(s.split('&!')[0].rstrip())
                need(not re.search(r'\b(?:gt|goto|gs|dynamic|killvar|copyarr|exec|msg|input|local)\b',expression,re.I),'Inserted call/state operation')
                variables=re.findall(r'\$[A-Za-z_][A-Za-z0-9_]*',expression)
                need(variables and set(variables)<={'$text','$replace'},'Inserted statement uses other variables '+repr(variables))
                names=set(re.findall(r'[A-Za-z_][A-Za-z0-9_]*',expression))
                need(names<={'text','replace','LITERAL','if','IF','iif','IIF'},'Inserted expression contains another identifier '+repr(names))
                need('&' not in expression,'Inserted statement chains another operation')
                indices=re.findall(r'\$text\[(\d+)\]',expression);need(all(i in ('1','2','3') for i in indices),'Unexpected source text index')
                need('LITERAL' in expression or '+' in expression,'Merge must use original dialogue text')
        need(any(scalar_text_write(x['text'].strip()) for x in added),'No dialogue merge added')
        need(fatal_changes==1,'Expected exactly one approved fatal argument repair')
        details['insertedLines']=added
        return {'onlyTextMergeInsertionsAndOneFatalDisplayArgumentRepair':True,'existingNumberedDialogueBytePreserved':True,'fatalDisplayArgumentRepairs':fatal_changes,'insertedLines':len(added),'newPersistentVariables':0}
    check('only_text_merge_and_provenance_insertions',insertions)
    def behavior():
        ac=control(ob);bc=control(nb);need(ac==bc,'condition/penalty/counter/control changed')
        digest=sha('\n'.join(ac).encode())
        return {'controlSha256':digest,'conditionsPenaltiesCountersAndCallDestinationsIdentical':True,'fatalArgumentOnlyChangesDisplayedTextToExistingIndex3':True,'newPersistentVariables':0,'newLocations':0}
    check('normalized_conditions_penalties_states_unchanged',behavior)
    def terminals():
        fatal=next(i for i,s in enumerate(nb) if s.strip()=='dynamic $death, $text[3]')
        fatal3=max(i for i in range(fatal) if nb[i].strip().startswith('$text[3] ='))
        normal=next(i for i,s in enumerate(nb) if s.strip().startswith("jump 'loop'"))
        normal3=max(i for i in range(normal) if nb[i].strip().startswith('$text[3] ='))
        merges=[i for i,s in enumerate(nb) if scalar_text_write(s.strip())]
        n=[i for i in merges if normal3<i<normal and i>fatal]
        need(fatal3<fatal,'Existing game-over text[3] must be assigned before direct transfer')
        need(n,'Normal visit reaches loop before its texts are merged')
        joined='\n'.join(nb[i] for i in n)
        need('$text[1]' in joined and '$text[2]' in joined and '$text[3]' in joined,'Normal path does not merge all existing numbered dialogue')
        need(re.search(r"\$replace\(\$text\[2\]\s*,\s*'</div>'\s*,\s*''\)",joined),'Normal text[2] display does not remove isolated closing div')
        need(joined.count('$replace')==1,'Only one isolated closing-div display cleanup is authorized')
        details['terminalMergeLines']={'gameOverDirectExistingIndex3Line':y0+fatal+1,'normal':[y0+i+1 for i in n]}
        return details['terminalMergeLines']
    check('normal_and_gameover_dialogue_transfer_paths',terminals)
    def qsp_balance():
        for x in added:
            s=x['text'].strip()
            if s and not s.startswith('!'):unquote(s)
        require_strings=['guild_reputation_rate -= min(guild_reputation_rate, 90)','guild_reputation_rate -= min(guild_reputation_rate, 80)','guild_reputation_rate -= min(guild_reputation_rate, 10 * gave_guild_ill_slave)','gave_guild_ill_slave = 0','gave_guild_parasite_slave = 0','end_day_guild_visit = 1']
        for text in require_strings:need(sum(text in s for s in ob)==sum(text in s for s in nb)==1,'required original statement changed '+text)
        return {'insertedQSPQuotesClosed':True,'originalCounterAndPenaltyStatementsPreserved':True,'fullEngineSyntaxCheck':'Parent performs separate compiler/native-engine validation.'}
    check('inserted_QSP_quotes_and_required_original_statements',qsp_balance)
    def unchanged_sources():
        need(before.read_bytes()==oldraw and candidate.read_bytes()==newraw,'Input changed during independent review')
        return 'Reviewer did not modify either QSP input'
    check('review_inputs_unchanged',unchanged_sources)
    details['unifiedDiff']='\n'.join(difflib.unified_diff(a,b,fromfile='before/end_day_screen',tofile='candidate/end_day_screen',lineterm=''))
    report={'pass':all(x['pass'] for x in checks),'created':datetime.datetime.now(datetime.timezone.utc).isoformat(),'before':str(before),'beforeSha256':sha(oldraw),'candidate':str(candidate),'candidateSha256':sha(newraw),'checks':checks,'details':details,'limits':['Independent read-only code review and static scope checks; no WORK/save/catalog writes.','Engine grammar and actual visual execution are verified separately by the parent.','No gameplay-policy, illness-policy, reputation-value or repeat-trigger changes are authorized by this review.']}
    output=HERE/'independent-review.json';preliminary=HERE/'preliminary-independent-review.json'
    if output.exists() and json.loads(output.read_text(encoding='utf-8')).get('pass') is False and not preliminary.exists():preliminary.write_bytes(output.read_bytes())
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'pass':report['pass'],'checks':len(checks),'failed':[x for x in checks if not x['pass']]},ensure_ascii=False))

if __name__=='__main__':main()
