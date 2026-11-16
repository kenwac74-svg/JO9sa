const fs=require('fs'),vm=require('vm'),a=require('assert/strict');
const s=fs.readFileSync('G:/somi/JO9sa/tools/modding-hub/overrides/character-view.mjs','utf8');
const c={};vm.createContext(c);vm.runInContext(s.slice(s.indexOf('export function parseQuestionnaire'),s.indexOf('const TYPE_GROUP')).replaceAll('export function','function'),c);
const rows=[[1,'example','표시명',['topic'],'질문 문구'],[5,'second','다음 질문',[],'두 번째 문구']];
const data=c.questionnaireJson(rows);a.deepEqual(JSON.parse(JSON.stringify(c.parseQuestionnaire(data))),rows);
for(const edit of [d=>d.version=2,d=>d.questions.push(d.questions[0]),d=>d.questions[0].level=1.5,d=>d.questions[0].topics=[1],d=>d.questions[0].id='<x>',d=>d.questions=[]]){const d=JSON.parse(JSON.stringify(data));edit(d);a.throws(()=>c.parseQuestionnaire(d));}
a(s.includes('data-cv-act="questions-export"'));a(s.includes('data-cv-act="questions-import"'));a(s.includes("root.querySelector('#cvQuestionnaireFile').addEventListener"));
console.log('PASS: JSON roundtrip, six invalid schemas rejected, UI bindings present.');
